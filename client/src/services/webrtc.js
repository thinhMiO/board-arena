/**
 * WebRTC Voice Chat Manager
 * Handles peer connections, microphone streaming, audio analysis for speaking indicators, and STUN servers.
 */
export class VoiceChatManager {
  constructor(socketService, roomCode, user) {
    this.socketService = socketService;
    this.roomCode = roomCode;
    this.user = user;

    this.localStream = null;
    this.peers = new Map(); // peerId -> RTCPeerConnection
    this.audioElements = new Map(); // peerId -> HTMLAudioElement

    this.isMuted = false;
    this.isDeafened = false;
    this.isSpeaking = false;
    this.activeSpeakers = new Set(); // set of peerIds currently speaking

    this.analyser = null;
    this.animFrameId = null;

    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.onSpeakersChanged = null;
    this.onRosterChanged = null;
    this.roster = []; // list of voice users in room
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
      return { success: false, error: 'Không thể truy cập microphone. Vui lòng cấp quyền trong trình duyệt.' };
    }
  }

  _setupAudioAnalyser(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      this.analyser = audioCtx.createAnalyser();
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
        const nowSpeaking = avg > 25 && !this.isMuted;

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
      console.warn('AudioAnalyser setup skipped', e);
    }
  }

  _setupSocketListeners() {
    const s = this.socketService.getSocket();

    // Roster of current voice users
    s.on('voice:roster', peers => {
      this.roster = peers;
      if (this.onRosterChanged) this.onRosterChanged(this.roster);
      // Initiate WebRTC offers to all existing peers
      peers.forEach(p => {
        if (p.peerId !== s.id) {
          this._createPeerConnection(p.peerId, true);
        }
      });
    });

    // New peer joined
    s.on('voice:peer_joined', ({ peerId, user }) => {
      this.roster.push({ peerId, ...user, muted: false, speaking: false });
      if (this.onRosterChanged) this.onRosterChanged(this.roster);
      // Wait for incoming offer or initiate
    });

    // Incoming offer
    s.on('voice:offer', async ({ fromPeerId, offer }) => {
      const pc = this._createPeerConnection(fromPeerId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socketService.emit('voice:answer', {
        toPeerId: fromPeerId,
        answer
      });
    });

    // Incoming answer
    s.on('voice:answer', async ({ fromPeerId, answer }) => {
      const pc = this.peers.get(fromPeerId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Incoming ICE candidate
    s.on('voice:ice-candidate', async ({ fromPeerId, candidate }) => {
      const pc = this.peers.get(fromPeerId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    // Peer state update (muted, speaking)
    s.on('voice:user_state', ({ peerId, muted, speaking }) => {
      const user = this.roster.find(r => r.peerId === peerId);
      if (user) {
        if (muted !== undefined) user.muted = muted;
        if (speaking !== undefined) {
          user.speaking = speaking;
          if (speaking) this.activeSpeakers.add(peerId);
          else this.activeSpeakers.delete(peerId);
        }
        if (this.onSpeakersChanged) this.onSpeakersChanged(speaking, peerId);
        if (this.onRosterChanged) this.onRosterChanged([...this.roster]);
      }
    });

    // Peer left
    s.on('voice:peer_left', ({ peerId }) => {
      this._removePeer(peerId);
      this.roster = this.roster.filter(r => r.peerId !== peerId);
      if (this.onRosterChanged) this.onRosterChanged(this.roster);
    });
  }

  _createPeerConnection(peerId, isInitiator) {
    if (this.peers.has(peerId)) return this.peers.get(peerId);

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peers.set(peerId, pc);

    // Add local mic audio tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE candidate generation
    pc.onicecandidate = event => {
      if (event.candidate) {
        this.socketService.emit('voice:ice-candidate', {
          toPeerId: peerId,
          candidate: event.candidate
        });
      }
    };

    // Remote audio track received
    pc.ontrack = event => {
      let audio = this.audioElements.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.audioElements.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.muted = this.isDeafened;
    };

    // If initiator, create offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.socketService.emit('voice:offer', {
            toPeerId: peerId,
            offer
          });
        } catch (e) {
          console.error('Error creating offer', e);
        }
      };
    }

    return pc;
  }

  _removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
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
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
    }
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.audioElements.forEach(a => { a.pause(); a.srcObject = null; });
    this.audioElements.clear();
  }
}
