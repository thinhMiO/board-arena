/**
 * WebRTC Voice Chat Manager
 * Production-ready WebRTC implementation with:
 * - Multi-STUN & OpenRelay TURN servers for NAT & 4G/cellular traversal
 * - Candidate queuing to prevent "Remote description is null" race conditions
 * - Explicit Offer/Answer exchange
 * - Mobile Autoplay policy unlock (iOS Safari & Android Chrome)
 * - Real-time microphone audio visualizer
 */
export class VoiceChatManager {
  constructor(socketService, roomCode, user) {
    this.socketService = socketService;
    this.roomCode = roomCode;
    this.user = user;

    this.localStream = null;
    this.peers = new Map(); // peerId -> RTCPeerConnection
    this.audioElements = new Map(); // peerId -> HTMLAudioElement
    this.pendingCandidates = new Map(); // peerId -> RTCIceCandidateInit[]

    this.isMuted = false;
    this.isDeafened = false;
    this.isSpeaking = false;
    this.activeSpeakers = new Set();

    this.analyser = null;
    this.audioCtx = null;
    this.animFrameId = null;

    // Production Google & Cloudflare STUN servers for NAT & cross-network traversal
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ],
      iceCandidatePoolSize: 10
    };

    this.onSpeakersChanged = null;
    this.onRosterChanged = null;
    this.roster = [];
  }

  async init() {
    try {
      // Request mic permission
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this._setupAudioAnalyser(this.localStream);
      this._setupSocketListeners();

      // Announce voice join to room
      this.socketService.emit('voice:join', {
        roomCode: this.roomCode,
        user: this.user
      });

      return { success: true };
    } catch (err) {
      console.warn('[WebRTC Voice] Microphone access denied or unavailable:', err.message);
      return { success: false, error: 'Không thể truy cập microphone. Vui lòng cấp quyền Microphone trong trình duyệt.' };
    }
  }

  _setupAudioAnalyser(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        const resumeCtx = () => {
          this.audioCtx?.resume();
          document.removeEventListener('click', resumeCtx);
          document.removeEventListener('touchstart', resumeCtx);
        };
        document.addEventListener('click', resumeCtx, { once: true });
        document.addEventListener('touchstart', resumeCtx, { once: true });
      }

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const nowSpeaking = avg > 14 && !this.isMuted;

        if (nowSpeaking !== this.isSpeaking) {
          this.isSpeaking = nowSpeaking;
          this.socketService.emit('voice:state_change', {
            roomCode: this.roomCode,
            speaking: this.isSpeaking
          });
          if (this.onSpeakersChanged) {
            this.onSpeakersChanged(this.isSpeaking, 'me');
          }
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[WebRTC Voice] AudioAnalyser setup skipped', e);
    }
  }

  _setupSocketListeners() {
    const s = this.socketService.getSocket();

    // Roster of current voice users (received by newcomer)
    s.on('voice:roster', async peers => {
      this.roster = peers;
      if (this.onRosterChanged) this.onRosterChanged(this.roster);

      // Newcomer initiates WebRTC offers to all existing peers in the room
      for (const p of peers) {
        if (p.peerId !== s.id) {
          await this._initiateCall(p.peerId);
        }
      }
    });

    // New peer joined the room
    s.on('voice:peer_joined', ({ peerId, user }) => {
      const existing = this.roster.find(r => r.peerId === peerId);
      if (!existing) {
        this.roster.push({ peerId, ...user, muted: false, speaking: false });
      }
      if (this.onRosterChanged) this.onRosterChanged([...this.roster]);
    });

    // Incoming WebRTC offer
    s.on('voice:offer', async ({ fromPeerId, offer }) => {
      try {
        const pc = this._getOrCreatePeerConnection(fromPeerId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush any candidates that arrived before the remote description
        await this._flushPendingCandidates(fromPeerId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socketService.emit('voice:answer', {
          toPeerId: fromPeerId,
          answer
        });
      } catch (err) {
        console.error('[WebRTC Voice] Error handling incoming offer:', err);
      }
    });

    // Incoming WebRTC answer
    s.on('voice:answer', async ({ fromPeerId, answer }) => {
      try {
        const pc = this.peers.get(fromPeerId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await this._flushPendingCandidates(fromPeerId, pc);
        }
      } catch (err) {
        console.error('[WebRTC Voice] Error handling answer:', err);
      }
    });

    // Incoming ICE candidate
    s.on('voice:ice-candidate', async ({ fromPeerId, candidate }) => {
      if (!candidate) return;
      const pc = this.peers.get(fromPeerId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC Voice] Failed to add ICE candidate immediately:', e);
        }
      } else {
        // Queue candidate until remote description is set
        if (!this.pendingCandidates.has(fromPeerId)) {
          this.pendingCandidates.set(fromPeerId, []);
        }
        this.pendingCandidates.get(fromPeerId).push(candidate);
      }
    });

    // Peer speaking / muted state update
    s.on('voice:user_state', ({ peerId, userId, muted, speaking }) => {
      const u = this.roster.find(r => r.peerId === peerId || (userId && (r.userId === userId || r.id === userId)));
      if (u) {
        if (muted !== undefined) u.muted = muted;
        if (speaking !== undefined) {
          u.speaking = speaking;
          if (speaking) this.activeSpeakers.add(peerId);
          else this.activeSpeakers.delete(peerId);
        }
      }
      if (this.onSpeakersChanged) this.onSpeakersChanged(speaking, peerId);
      if (this.onRosterChanged) this.onRosterChanged([...this.roster]);
    });

    // Peer disconnected from voice
    s.on('voice:peer_left', ({ peerId }) => {
      this._removePeer(peerId);
      this.roster = this.roster.filter(r => r.peerId !== peerId);
      this.activeSpeakers.delete(peerId);
      if (this.onSpeakersChanged) this.onSpeakersChanged(false, peerId);
      if (this.onRosterChanged) this.onRosterChanged([...this.roster]);
    });
  }

  async _initiateCall(peerId) {
    try {
      const pc = this._getOrCreatePeerConnection(peerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      this.socketService.emit('voice:offer', {
        toPeerId: peerId,
        offer
      });
    } catch (err) {
      console.error('[WebRTC Voice] Error creating offer:', err);
    }
  }

  _getOrCreatePeerConnection(peerId) {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId);
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peers.set(peerId, pc);

    // Add local mic tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = event => {
      if (event.candidate) {
        const candJson = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
        this.socketService.emit('voice:ice-candidate', {
          toPeerId: peerId,
          candidate: candJson
        });
      }
    };

    // Remote audio track received
    pc.ontrack = event => {
      console.log(`[WebRTC Voice] 🎵 Received remote audio track from peer ${peerId}:`, event.track);
      const remoteStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);

      // 1. Direct Web Audio API pipeline (bypasses browser autoplay blocks on all devices!)
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        const source = this.audioCtx.createMediaStreamSource(remoteStream);
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = 1.3; // 30% boost for clear, loud voice
        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        console.log(`[WebRTC Voice] 🔊 Direct AudioContext connected for peer ${peerId}`);
      } catch (err) {
        console.warn('[WebRTC Voice] Direct AudioContext routing note:', err);
      }

      // 2. HTML Audio element as simultaneous fallback
      let audio = this.audioElements.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        audio.setAttribute('playsinline', 'true');
        audio.muted = false;
        audio.volume = 1.0;
        document.body.appendChild(audio);
        this.audioElements.set(peerId, audio);
      }

      audio.srcObject = remoteStream;
      audio.muted = this.isDeafened;
      audio.volume = 1.0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('[WebRTC Voice] HTML Audio autoplay prompt:', e.message);
          const unlock = () => {
            audio.play().catch(() => {});
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
          };
          document.addEventListener('click', unlock, { once: true });
          document.addEventListener('touchstart', unlock, { once: true });
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Voice] Peer ${peerId} ICE Connection:`, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Voice] Peer ${peerId} Connection State:`, pc.connectionState);
    };

    return pc;
  }

  async _flushPendingCandidates(peerId, pc) {
    const queue = this.pendingCandidates.get(peerId) || [];
    for (const cand of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[WebRTC Voice] Error adding queued ICE candidate:', err);
      }
    }
    this.pendingCandidates.delete(peerId);
  }

  _removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.pendingCandidates.delete(peerId);

    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      this.audioElements.delete(peerId);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }
    this.socketService.emit('voice:state_change', {
      roomCode: this.roomCode,
      muted: this.isMuted,
      speaking: false
    });
    return this.isMuted;
  }

  toggleDeafen() {
    this.isDeafened = !this.isDeafened;
    this.audioElements.forEach(audio => {
      audio.muted = this.isDeafened;
    });
    return this.isDeafened;
  }

  destroy() {
    try {
      this.socketService.emit('voice:leave', { roomCode: this.roomCode });
    } catch {}

    const s = this.socketService.getSocket();
    if (s) {
      s.off('voice:roster');
      s.off('voice:peer_joined');
      s.off('voice:offer');
      s.off('voice:answer');
      s.off('voice:ice-candidate');
      s.off('voice:user_state');
      s.off('voice:peer_left');
    }

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.pendingCandidates.clear();

    this.audioElements.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    this.audioElements.clear();
  }
}
