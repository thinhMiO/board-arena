import React, { useState, useEffect, useRef } from 'react';
import { BoardRenderer } from './boards/BoardRenderer';
import { GameRegistry } from '@shared/games/index.js';
import { sound } from '../services/audio';
import { VoiceChatManager } from '../services/webrtc';
import { socketService } from '../services/socket';
import {
  ArrowLeft, Mic, MicOff, Volume2, VolumeX, MessageSquare, Flag,
  RotateCcw, History, Copy, Check, Send, Smile, Users, Radio, BookOpen, Eye, Share2, Play
} from 'lucide-react';
import { GameGuideModal } from './GameGuideModal';
import confetti from 'canvas-confetti';

// Helper to get descriptive side / piece name for each game
const getSideName = (gId, pIdx) => {
  switch (gId) {
    case 'co_ca_ngua':
      return pIdx === 0 ? 'Phe Đỏ 🔴' : pIdx === 1 ? 'Phe Vàng 🟡' : pIdx === 2 ? 'Phe Lam 🔵' : 'Phe Lục 🟢';
    case 'chess':
      return pIdx === 0 ? 'Quân Trắng ♔' : 'Quân Đen ♚';
    case 'xiangqi':
      return pIdx === 0 ? 'Quân Đỏ 🔴' : 'Quân Đen ⚫';
    case 'go':
      return pIdx === 0 ? 'Quân Đen ⚫' : 'Quân Trắng ⚪';
    case 'gomoku':
      return pIdx === 0 ? 'Quân X (Đen) ❌' : 'Quân O (Trắng) ⭕';
    case 'checkers':
      return pIdx === 0 ? 'Quân Đỏ 🔴' : 'Quân Đen ⚫';
    case 'reversi':
      return pIdx === 0 ? 'Quân Đen ⚫' : 'Quân Trắng ⚪';
    case 'connect_four':
      return pIdx === 0 ? 'Quân Đỏ 🔴' : 'Quân Vàng 🟡';
    case 'shogi':
      return pIdx === 0 ? 'Tiên (Sente) ☗' : 'Hậu (Gote) ☖';
    case 'co_ganh':
      return pIdx === 0 ? 'Quân Đỏ 🔴' : 'Quân Xanh 🔵';
    case 'o_an_quan':
      return pIdx === 0 ? 'Dân Đỏ (Dưới)' : 'Dân Vàng (Trên)';
    case 'nine_mens_morris':
      return pIdx === 0 ? 'Quân Trắng ⚪' : 'Quân Đen ⚫';
    default:
      return `Người chơi ${pIdx + 1}`;
  }
};

export const GameBoardView = ({ matchConfig, user, onExitMatch, onUserUpdated }) => {
  const { gameId, mode, roomCode: initialRoomCode, difficulty, timeControl } = matchConfig;
  const isSpectator = Boolean(matchConfig?.isSpectator || matchConfig?.role === 'spectator');
  const game = GameRegistry.get(gameId);

  // Match State
  const [gameState, setGameState] = useState(() => {
    // If waiting for opponent in online room, ALWAYS use clean initial game state!
    if (mode === 'online' && (!matchConfig?.room || matchConfig.room.status === 'waiting')) {
      return game ? game.init() : null;
    }
    if (matchConfig?.room?.gameState) return matchConfig.room.gameState;
    return game ? game.init() : null;
  });
  const [roomData, setRoomData] = useState(matchConfig?.room || null);
  const [spectators, setSpectators] = useState(matchConfig?.room?.spectators || []);
  const [myPlayerIndex, setMyPlayerIndex] = useState(() => {
    if (isSpectator) return -1;
    if (matchConfig?.playerIndex !== undefined) return matchConfig.playerIndex;
    return 0;
  });
  const [roomCode, setRoomCode] = useState(initialRoomCode || null);

  const isWaitingForOpponent = mode === 'online' && !isSpectator && (!roomData?.players || roomData.players.length < 2 || roomData?.status === 'waiting');

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history' | 'voice'
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Clocks
  const [clocks, setClocks] = useState(() => {
    const t = matchConfig?.room?.timer;
    return t?.times || t?.clocks || { 0: 600, 1: 600 };
  });
  const [clockRunning, setClockRunning] = useState(() => {
    if (mode === 'online') {
      return matchConfig?.room?.status === 'playing';
    }
    return true; // Start clock in AI / local mode
  });

  // Chat & History
  const [messages, setMessages] = useState(() => [
    {
      id: '1',
      sender: 'HỆ THỐNG',
      isSystem: true,
      text: isSpectator
        ? `👁️ Bạn đang xem trực tiếp trận đấu ${game?.nameVi}! Chúc bạn có những phút giây kịch tính.`
        : `Chào mừng bạn đến với ${game?.nameVi}! Trận đấu sẵn sàng.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameOverReason, setGameOverReason] = useState(null);

  // Voice Chat
  const [voiceManager, setVoiceManager] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceRoster, setVoiceRoster] = useState([]);
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());

  // Online Friends to Invite directly
  const [friendsList, setFriendsList] = useState([]);
  const [onlineFriendsMap, setOnlineFriendsMap] = useState({});
  const [invitedFriends, setInvitedFriends] = useState(new Set());

  // Fetch friends list and check online status when waiting for opponent
  useEffect(() => {
    if (isWaitingForOpponent && user?.id) {
      fetch(`/api/users/${user.id}/friends`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFriendsList(data);
            const friendIds = data.map(f => f.id);
            socketService.emit('friends:check_online', { friendIds }, map => {
              if (map) setOnlineFriendsMap(map);
            });
          }
        })
        .catch(() => {});
    }
  }, [isWaitingForOpponent, user?.id]);

  // Listen to dynamic friend online/offline changes
  useEffect(() => {
    const s = socketService.getSocket();
    const handleOnlineStatus = ({ userId, isOnline }) => {
      setOnlineFriendsMap(prev => ({ ...prev, [userId]: isOnline }));
    };
    s.on('users:online_status', handleOnlineStatus);
    return () => s.off('users:online_status', handleOnlineStatus);
  }, []);

  const handleInviteOnlineFriend = (friend) => {
    socketService.emit('friend:invite', {
      toUserId: friend.id,
      roomCode,
      gameId,
      gameName: game?.nameVi || 'Bàn Cờ'
    }, res => {
      if (res?.success) {
        sound.playCheck();
        setInvitedFriends(prev => new Set([...prev, friend.id]));
      } else {
        alert(res?.error || 'Không thể gửi lời mời lúc này');
      }
    });
  };

  // Handle exiting room cleanly
  const handleExitMatch = () => {
    // If playing an active online match, confirm forfeit
    if (mode === 'online' && roomCode && !isSpectator && gameState && !gameState.gameOver && roomData?.status === 'playing') {
      const confirmExit = window.confirm('Trận đấu đang diễn ra! Nếu rời bàn bạn sẽ bị XỬ THUA. Bạn có chắc muốn rời không?');
      if (!confirmExit) return;
    }

    if (roomCode) {
      socketService.emit('room:leave', { roomCode, userId: user?.id });
    }
    if (voiceManager) {
      voiceManager.destroy();
      setVoiceManager(null);
    }
    onExitMatch();
  };

  // AI loop for AI mode
  useEffect(() => {
    if (mode === 'ai' && gameState && !gameState.gameOver && gameState.turn === 1) {
      const timer = setTimeout(() => {
        const aiMove = game.getAIMove(gameState, 1, difficulty || 'medium');
        if (aiMove) {
          executeMove(aiMove, 1);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState, mode]);

  // Timer loop: counts down each second for the player whose turn it is
  useEffect(() => {
    const isPlaying = (mode === 'online' ? roomData?.status === 'playing' : clockRunning) && gameState && !gameState.gameOver && !isWaitingForOpponent;
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setClocks(prev => {
        const active = gameState.turn ?? 0;
        const currentSecs = prev[active] ?? prev[String(active)] ?? 600;
        const nextTime = Math.max(0, currentSecs - 1);
        if (nextTime === 0 && !gameState.gameOver) {
          if (mode !== 'online') {
            handleGameOver(1 - active, 'Hết thời gian thi đấu!');
          }
        }
        return { ...prev, [active]: nextTime, [String(active)]: nextTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, roomData?.status, clockRunning, gameState?.turn, gameState?.gameOver, isWaitingForOpponent]);

  // Socket room listeners
  useEffect(() => {
    if (mode === 'online' && roomCode) {
      const s = socketService.getSocket();
      s.on('game:move_made', ({ move, notation, playerIndex, gameState: newGs, timer }) => {
        setGameState(newGs);
        if (timer) {
          const incoming = timer.times || timer.clocks;
          if (incoming) setClocks(incoming);
        }
        setClockRunning(true);
        setMoveHistory(prev => [...prev, { ply: prev.length + 1, notation }]);
        if (newGs.inCheck) {
          sound.playCheck();
        } else {
          sound.playMove();
        }
      });

      s.on('game:started', ({ gameState: startGs, timer }) => {
        setGameState(startGs);
        if (timer) {
          const incoming = timer.times || timer.clocks;
          if (incoming) setClocks(incoming);
        }
        setClockRunning(true);
        setMoveHistory([]);
        sound.playVictory();
      });

      s.on('game:ended', ({ winnerIndex, reason, ratingDeltas }) => {
        setClockRunning(false);
        handleGameOver(winnerIndex, reason, ratingDeltas);
      });

      s.on('timer:sync', timerData => {
        if (!timerData) return;
        const incoming = timerData.times || timerData.clocks;
        if (incoming) setClocks(incoming);
      });

      s.on('spectators:updated', ({ count, spectators: specList }) => {
        setSpectators(specList || []);
      });

      s.on('room:updated', updatedRoom => {
        setRoomData(updatedRoom);
        if (updatedRoom.spectators) setSpectators(updatedRoom.spectators);
        // While waiting for opponent, ALWAYS enforce brand new untouched board!
        if (updatedRoom.status === 'waiting') {
          setGameState(game.init());
          setMoveHistory([]);
          setClockRunning(false);
        } else if (updatedRoom.gameState) {
          setGameState(updatedRoom.gameState);
        }
        if (updatedRoom.status === 'playing') {
          setClockRunning(true);
        }
        if (updatedRoom.timer) {
          const incoming = updatedRoom.timer.times || updatedRoom.timer.clocks;
          if (incoming) setClocks(incoming);
        }
      });

      s.on('chat:message', msg => {
        setMessages(prev => [...prev, msg]);
      });

      return () => {
        s.off('game:move_made');
        s.off('game:started');
        s.off('game:ended');
        s.off('spectators:updated');
        s.off('room:updated');
        s.off('chat:message');
        s.off('timer:sync');
      };
    }
  }, [mode, roomCode]);

  // Voice Chat initialization for Online rooms
  const handleToggleVoice = async () => {
    if (!voiceManager) {
      const vm = new VoiceChatManager(socketService, roomCode || 'offline', user);
      const res = await vm.init();
      if (res.success) {
        vm.onRosterChanged = roster => setVoiceRoster(roster);
        vm.onSpeakersChanged = (isSpeaking, peerId) => {
          setActiveSpeakers(prev => {
            const next = new Set(prev);
            if (isSpeaking) next.add(peerId);
            else next.delete(peerId);
            return next;
          });
        };
        setVoiceManager(vm);
        setIsVoiceActive(true);
      } else {
        alert(res.error);
      }
    } else {
      voiceManager.destroy();
      setVoiceManager(null);
      setIsVoiceActive(false);
    }
  };

  const executeMove = (move, playerIndex) => {
    if (!game || !gameState || gameState.gameOver || isWaitingForOpponent) return;

    if (mode === 'online' && roomCode) {
      socketService.emit('game:move', { roomCode, move });
      return;
    }

    // Local / AI execution
    const res = game.makeMove(gameState, move, playerIndex);
    if (res.valid) {
      setGameState(res.nextState);
      const notation = game.formatMove(move, res.nextState);
      setMoveHistory(prev => [...prev, { ply: prev.length + 1, notation }]);
      setClockRunning(true);
      if (res.nextState.inCheck) {
        sound.playCheck();
      } else {
        sound.playMove();
      }

      if (res.result && res.result.over) {
        handleGameOver(res.result.winner, res.result.reason);
      }
    }
  };

  const handleGameOver = (winnerIndex, reason, ratingDeltas = null) => {
    setGameOverReason(reason);
    const isMeWinner = winnerIndex === myPlayerIndex;
    if (isMeWinner) {
      sound.playVictory();
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {}
    } else if (winnerIndex !== null) {
      sound.playMove();
    }

    setGameState(prev => ({ ...prev, gameOver: true, winner: winnerIndex }));
    setClockRunning(false);
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'HỆ THỐNG', isSystem: true, text: `🏆 Trận đấu kết thúc: ${reason}` }
    ]);

    // Record match to database for logged in user to update Elo and Leaderboard
    if (user?.id && !isSpectator) {
      if (mode === 'online') {
        if (ratingDeltas && ratingDeltas[user.id] !== undefined) {
          const delta = ratingDeltas[user.id];
          const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;
          fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('board_arena_token') || ''}`
            }
          })
          .then(res => res.json())
          .then(updatedUser => {
            if (updatedUser && !updatedUser.error) {
              localStorage.setItem('board_arena_user', JSON.stringify(updatedUser));
              if (onUserUpdated) onUserUpdated(updatedUser);
              const newRating = (updatedUser.ratings && updatedUser.ratings[gameId]) || 1500;
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now().toString(),
                  sender: 'HỆ THỐNG',
                  isSystem: true,
                  text: `📈 Điểm Elo: ${newRating} (${deltaSign} Elo) • Đã cập nhật Bảng Xếp Hạng!`
                }
              ]);
            }
          })
          .catch(() => {});
        }
      } else {
        const result = winnerIndex === myPlayerIndex ? 'win' : (winnerIndex !== null ? 'loss' : 'draw');
        fetch('/api/matches/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            gameId,
            result,
            opponentName: mode === 'ai' ? `Máy AI (${difficulty})` : 'Đối Thủ',
            reason
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            localStorage.setItem('board_arena_user', JSON.stringify(data.user));
            if (onUserUpdated) onUserUpdated(data.user);
            const deltaSign = data.delta > 0 ? `+${data.delta}` : `${data.delta}`;
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                sender: 'HỆ THỐNG',
                isSystem: true,
                text: `📈 Điểm Elo: ${data.newRating} (${deltaSign} Elo) • Đã cập nhật Bảng Xếp Hạng!`
              }
            ]);
          }
        })
        .catch(() => {});
      }
    }
  };

  const handleResign = () => {
    if (gameState?.gameOver) return;
    const confirmResign = window.confirm('Bạn có chắc chắn muốn xin hàng (chịu thua) ván cờ này không?');
    if (!confirmResign) return;

    if (mode === 'online' && roomCode) {
      socketService.emit('game:resign', { roomCode });
    } else {
      handleGameOver(1 - myPlayerIndex, 'Người chơi đã chịu thua (Resign).');
    }
  };

  const handleSendMessage = e => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const senderName = isSpectator ? `👁️ [Khán Giả] ${user?.displayName || 'Ẩn danh'}` : (user?.displayName || 'Bạn');
    const msg = {
      id: Date.now().toString(),
      sender: senderName,
      text: inputText.trim(),
      timestamp: Date.now()
    };

    if (mode === 'online' && roomCode) {
      socketService.emit('chat:send', { roomCode, text: inputText.trim() });
    } else {
      setMessages(prev => [...prev, msg]);
    }
    setInputText('');
  };

  const sendQuickChat = text => {
    const senderName = isSpectator ? `👁️ [Khán Giả] ${user?.displayName || 'Ẩn danh'}` : (user?.displayName || 'Bạn');
    if (mode === 'online' && roomCode) {
      socketService.emit('chat:send', { roomCode, text });
    } else {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: senderName, text }]);
    }
  };

  const formatTime = seconds => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return '10:00';
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    sound.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyInviteLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    sound.playClick();
    setTimeout(() => setIsLinkCopied(false), 2500);
  };

  const player0 = isSpectator
    ? (roomData?.players?.[0] || { displayName: 'Người chơi 1 (Đỏ/Trắng)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1', rating: 1500 })
    : (user || { displayName: 'Bạn', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user', rating: 1500 });

  const player1 = isSpectator
    ? (roomData?.players?.[1] || { displayName: 'Người chơi 2 (Đen/Vàng)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2', rating: 1500 })
    : (mode === 'ai'
        ? { displayName: `AI (${difficulty})`, avatar: null, rating: 1500 }
        : (matchConfig?.opponent || roomData?.players?.find(p => p.id !== user?.id) || { displayName: 'Đối Thủ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=opponent', rating: 1500 }));

  // Precise Voice Status for Opponent and Myself
  const opponentVoice = voiceRoster.find(
    r => (player1?.id && (r.userId === player1.id || r.id === player1.id)) ||
         (player1?.displayName && r.displayName === player1.displayName)
  );
  const isOpponentVoiceConnected = Boolean(opponentVoice);
  const isOpponentMuted = opponentVoice ? opponentVoice.muted : false;
  const isOpponentSpeaking = opponentVoice ? Boolean(opponentVoice.speaking) : (opponentVoice?.peerId ? activeSpeakers.has(opponentVoice.peerId) : false);

  const isMyVoiceConnected = isVoiceActive;
  const isMyMuted = isMicMuted;
  const isMySpeaking = activeSpeakers.has('me');

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between glass-panel px-4 py-2.5 rounded-2xl mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {isSpectator ? 'Rời Khán Đài' : 'Rời Trận'}
          </button>
          <button
            onClick={() => setIsGuideOpen(true)}
            title="Xem luật chơi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-bold text-xs transition-colors border border-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5" /> Luật Chơi
          </button>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white font-serif flex items-center gap-2">
              {game?.nameVi}
              <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${
                isSpectator
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {isSpectator ? '👁️ Đang Xem Trực Tiếp' : mode === 'ai' ? `Đấu AI (${difficulty})` : mode === 'pass_play' ? 'Offline 2 Người' : 'Trực Tuyến'}
              </span>
            </h2>
          </div>
        </div>

        {/* Room Code Share & Spectator Counter */}
        <div className="flex items-center gap-2">
          {mode === 'online' && !isSpectator && (
            <button
              onClick={handleToggleVoice}
              title={isVoiceActive ? 'Voice đang bật (Bấm để tắt)' : 'Bấm để bật Voice Chat trực tiếp'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isVoiceActive
                  ? (isMySpeaking
                      ? 'bg-emerald-500 text-black border-emerald-300 ring-2 ring-emerald-400/50 shadow-lg'
                      : (isMicMuted
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'))
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {isVoiceActive ? (
                isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              <span>{isVoiceActive ? (isMicMuted ? 'Mic Đang Tắt' : 'Voice Đang Bật') : 'Bật Voice'}</span>
            </button>
          )}

          {isSpectator && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <Eye className="w-3.5 h-3.5" />
              <span>Khán Giả: {spectators.length}</span>
            </div>
          )}
          {roomCode && (
            <>
              <button
                onClick={copyRoomCode}
                title="Sao chép mã phòng"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
              >
                <span>Mã: <strong className="font-mono text-amber-300">{roomCode}</strong></span>
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={copyInviteLink}
                title="Sao chép link mời bạn bè"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all active:scale-95 shadow"
              >
                {isLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isLinkCopied ? 'Đã chép link' : 'Link Mời'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Board & Side Panel Arena Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left / Center: Players and Board (8 Cols on Desktop) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          
          {/* Opponent Player Bar (or Waiting State / Player 1 for Spectator) */}
          <div className="w-[min(86vw,min(68vh,500px))] flex items-center justify-between glass-panel px-3.5 py-1.5 sm:py-2 rounded-xl mb-2 shadow-lg">
            {isWaitingForOpponent ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-dashed border-amber-500/60 flex items-center justify-center font-bold text-sm text-amber-400 animate-pulse">
                  👤
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Đang chờ bạn bè vào bàn...</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Mã phòng: <strong className="text-amber-400">{roomCode}</strong> (Nhập để chơi/xem)
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative">
                  {player1.avatar && player1.avatar.startsWith('http') ? (
                    <img
                      src={player1.avatar}
                      alt={player1.displayName}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        isOpponentSpeaking
                          ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.8)] scale-105'
                          : (gameState?.turn === 1 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700')
                      }`}
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-full bg-slate-800 border-2 flex items-center justify-center font-bold text-sm transition-all ${
                      isOpponentSpeaking
                        ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.8)] scale-105'
                        : (gameState?.turn === 1 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700')
                    }`}>
                      {player1.avatar || (mode === 'ai' ? '🤖' : '👤')}
                    </div>
                  )}
                  {isOpponentSpeaking && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-black animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {player1.displayName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {getSideName(gameId, 1)}
                    </span>
                    {/* Opponent Voice Status Indicator */}
                    {isOpponentVoiceConnected ? (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                        isOpponentSpeaking
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse'
                          : (isOpponentMuted
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30')
                      }`}>
                        {isOpponentSpeaking ? (
                          <>
                            <span className="flex items-end gap-0.5 h-2.5 px-0.5">
                              <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            <span>Đang nói...</span>
                          </>
                        ) : isOpponentMuted ? (
                          <>
                            <MicOff className="w-2.5 h-2.5 text-red-400" />
                            <span>Tắt mic</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Bật mic</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5">
                        <MicOff className="w-2.5 h-2.5" /> Chưa bật voice
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Rating: {player1.rating || 1500}
                  </div>
                </div>
              </div>
            )}

            {/* Opponent Clock or Waiting Badge */}
            {isWaitingForOpponent ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 animate-pulse">
                ⏳ Đang chờ...
              </span>
            ) : (
              <div className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${gameState?.turn === 1 ? 'bg-amber-500 text-black animate-pulse-fast' : 'bg-slate-900 text-slate-300'}`}>
                {formatTime(clocks[1] ?? clocks['1'])}
              </div>
            )}
          </div>

          {/* WAITING FOR FRIEND PROMINENT HUD CARD */}
          {isWaitingForOpponent && roomCode && (
            <div className="w-[min(86vw,min(68vh,500px))] mb-3 p-4 sm:p-5 rounded-2xl glass-panel border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/90 via-slate-900/95 to-slate-950/95 shadow-2xl animate-fade-in">
              <div className="text-center mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Bàn Chơi Đã Tạo • Đang Chờ Bạn Bè</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white font-serif">
                  Mời Bạn Bè Cùng Chơi Hoặc Vào Khán Đài Xem
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Gửi mã phòng hoặc link mời cho bạn bè qua Zalo, Messenger, Telegram... Bạn bè chỉ cần bấm vào link là vào bàn ngay!
                </p>
              </div>

              {/* Big Room Code Display */}
              <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/40 text-center mb-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  MÃ PHÒNG ĐỂ VÀO BÀN
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
                  {roomCode.split('').map((char, idx) => (
                    <span
                      key={idx}
                      className="w-8 h-10 sm:w-10 sm:h-12 rounded-xl bg-slate-900 border border-amber-400/60 text-amber-300 font-mono font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-amber-500/10"
                    >
                      {char}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-amber-200/80 font-medium">
                  (Nhập mã này ở ô "Chơi Chung Bằng Mã Phòng" hoặc "Khán Đài")
                </div>
              </div>

              {/* Quick Action Copy Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={copyRoomCode}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-950 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Đã Sao Chép Mã Phòng!' : 'Sao Chép Mã Phòng'}</span>
                </button>

                <button
                  onClick={copyInviteLink}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-extrabold text-xs shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isLinkCopied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Share2 className="w-4 h-4 text-amber-400" />}
                  <span>{isLinkCopied ? 'Đã Sao Chép Link!' : 'Sao Chép Link Mời Bạn Bè'}</span>
                </button>
              </div>

              {/* Online Friends List to Invite Directly */}
              {friendsList.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Bạn Bè Đang Online ({friendsList.filter(f => onlineFriendsMap[f.id]).length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Bấm "Mời Ngay" để gửi lời mời trực tiếp</span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {friendsList.map(friend => {
                      const isOnline = Boolean(onlineFriendsMap[friend.id]);
                      const isInvited = invitedFriends.has(friend.id);
                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <img
                                src={friend.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=friend'}
                                alt={friend.displayName}
                                className="w-7 h-7 rounded-full bg-slate-800"
                              />
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-bold text-white text-[11px] flex items-center gap-1">
                                {friend.displayName}
                                {isOnline ? (
                                  <span className="text-[9px] text-emerald-400 font-bold px-1 bg-emerald-500/10 rounded">Online</span>
                                ) : (
                                  <span className="text-[9px] text-slate-500">Offline</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleInviteOnlineFriend(friend)}
                            disabled={!isOnline || isInvited}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                              isInvited
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                                : (isOnline
                                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow active:scale-95'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed')
                            }`}
                          >
                            {isInvited ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Đã Mời</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-black" />
                                <span>Mời Ngay ⚡</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHECK (CHIẾU TƯỚNG) WARNING ALERT BANNER */}
          {gameState?.inCheck && !gameState?.gameOver && (
            <div className="w-[min(86vw,min(68vh,500px))] mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 border-2 border-red-300 text-white shadow-[0_0_25px_rgba(239,68,68,0.85)] flex items-center justify-center gap-2 animate-bounce-short z-20">
              <span className="text-lg">⚠️</span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {gameState.turn === myPlayerIndex
                  ? 'BẠN ĐANG BỊ CHIẾU TƯỚNG! (CẦN GIẢI CHIẾU)'
                  : (isSpectator
                      ? `CHIẾU TƯỚNG! ${gameState.turn === 0 ? player0.displayName : player1.displayName} ĐANG BỊ CHIẾU!`
                      : 'ĐANG CHIẾU TƯỚNG ĐỐI THỦ!')}
              </span>
              <span className="text-lg">⚡</span>
            </div>
          )}

          {/* ACTIVE TURN HUD BANNER */}
          <div className="w-[min(86vw,min(68vh,500px))] mb-1.5">
            {gameState?.gameOver ? (
              <div className={`p-3 rounded-2xl border-2 text-center shadow-xl animate-fade-in ${
                gameState.winner === myPlayerIndex
                  ? 'bg-gradient-to-r from-emerald-950/80 via-amber-950/70 to-emerald-950/80 border-emerald-400'
                  : (gameState.winner !== null ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-red-500' : 'bg-slate-900/80 border-amber-400')
              }`}>
                <div className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-center gap-2">
                  {gameState.winner === myPlayerIndex
                    ? '🎉 BẠN ĐÃ CHIẾN THẮNG!'
                    : (gameState.winner !== null
                        ? (isSpectator ? `🏆 ${roomData?.players?.[gameState.winner]?.displayName || 'Người chơi'} CHIẾN THẮNG` : '🏆 ĐỐI THỦ CHIẾN THẮNG')
                        : '🤝 HÒA CỜ')}
                </div>
                {gameOverReason && (
                  <div className="text-xs text-slate-300 font-medium mt-1">
                    {gameOverReason}
                  </div>
                )}
              </div>
            ) : isSpectator ? (
              <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/90 border-2 border-red-500/70 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black text-amber-300">
                    👁️ LƯỢT ĐI: {gameState?.turn === 0 ? player0.displayName : player1.displayName} ({getSideName(gameId, gameState?.turn)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                    🔴 TRỰC TIẾP
                  </span>
                  {moveHistory.length > 0 && (
                    <span className="text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                      ⚡ {moveHistory[moveHistory.length - 1].notation}
                    </span>
                  )}
                </div>
              </div>
            ) : mode === 'pass_play' ? (
              <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/70 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-black text-amber-300">
                    🎯 LƯỢT: NGƯỜI CHƠI {gameState?.turn + 1} ({getSideName(gameId, gameState?.turn)})
                  </span>
                </div>
                {moveHistory.length > 0 && (
                  <span className="text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                    ⚡ {moveHistory[moveHistory.length - 1].notation}
                  </span>
                )}
              </div>
            ) : gameState?.turn === myPlayerIndex ? (
              <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)] flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎯</span>
                  <div>
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                      ĐẾN LƯỢT BẠN ĐI!
                    </span>
                    <span className="hidden sm:inline text-[11px] font-bold text-emerald-200/90 ml-1.5">
                      ({getSideName(gameId, myPlayerIndex)})
                    </span>
                  </div>
                </div>
                {moveHistory.length > 0 && (
                  <span className="text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded text-emerald-200 border border-emerald-800">
                    ⚡ {moveHistory[moveHistory.length - 1].notation}
                  </span>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span>⏳ ĐỐI THỦ ĐANG SUY NGHĨ... ({getSideName(gameId, gameState?.turn)})</span>
                </div>
                {moveHistory.length > 0 && (
                  <span className="text-[11px] font-mono bg-black/40 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                    ⚡ {moveHistory[moveHistory.length - 1].notation}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Board Component */}
          <div className="relative my-1">
            {gameState && (
              <BoardRenderer
                gameId={gameId}
                gameState={gameState}
                onMove={move => executeMove(move, gameState.turn)}
                playerIndex={isSpectator ? 0 : myPlayerIndex}
                isInteractive={!isSpectator && !isWaitingForOpponent && !gameState.gameOver && (mode === 'pass_play' || gameState.turn === myPlayerIndex)}
              />
            )}
          </div>

          {/* User Player Bar (or Player 0 for Spectator) */}
          <div className="w-[min(86vw,min(68vh,500px))] flex items-center justify-between glass-panel px-3.5 py-1.5 sm:py-2 rounded-xl mt-2 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={player0.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt="avatar"
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    isMySpeaking
                      ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.8)] scale-105'
                      : (gameState?.turn === 0 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700')
                  }`}
                />
                {isMySpeaking && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-black animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white">{player0.displayName}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {getSideName(gameId, 0)}
                  </span>
                  {/* My Voice Status Indicator */}
                  {isMyVoiceConnected ? (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                      isMySpeaking
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse'
                        : (isMyMuted
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30')
                    }`}>
                      {isMySpeaking ? (
                        <>
                          <span className="flex items-end gap-0.5 h-2.5 px-0.5">
                            <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          <span>Bạn đang nói...</span>
                        </>
                      ) : isMyMuted ? (
                        <>
                          <MicOff className="w-2.5 h-2.5 text-red-400" />
                          <span>Đang tắt mic</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Đang bật mic</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <button
                      onClick={handleToggleVoice}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-0.5"
                    >
                      <Mic className="w-2.5 h-2.5" /> Bật Voice
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  Rating: {player0.rating || 1500}
                </div>
              </div>
            </div>

            {/* User Clock */}
            <div className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${gameState?.turn === 0 ? 'bg-amber-500 text-black animate-pulse-fast' : 'bg-slate-900 text-slate-300'}`}>
              {formatTime(clocks[0] ?? clocks['0'])}
            </div>
          </div>
        </div>

        {/* Right: Side Panel (Chat, Voice, Move History) (4 Cols on Desktop) */}
        <div className="lg:col-span-4 w-full glass-panel rounded-2xl flex flex-col h-[520px] overflow-hidden border border-slate-800">
          
          {/* Side Tabs Header */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'chat' ? 'bg-slate-800 text-amber-400 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Trò Chuyện
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'voice' ? 'bg-slate-800 text-amber-400 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Voice Chat
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'history' ? 'bg-slate-800 text-amber-400 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Nước Đi
            </button>
          </div>

          {/* TAB 1: Realtime Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col p-3 overflow-hidden">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`text-xs p-2 rounded-xl leading-relaxed ${
                      m.isSystem
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center font-semibold'
                        : m.sender === (user?.displayName || 'Bạn')
                        ? 'bg-amber-600 text-black font-medium ml-auto max-w-[85%] rounded-br-none'
                        : 'bg-slate-800 text-slate-200 mr-auto max-w-[85%] rounded-bl-none'
                    }`}
                  >
                    {!m.isSystem && (
                      <div className="font-bold text-[10px] opacity-75 mb-0.5">{m.sender}</div>
                    )}
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>

              {/* Quick Messages */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {['Xin chào! 👋', 'Chúc may mắn! 🍀', 'Nước đi hay! 👏', 'Đấu lại ván nữa? ⚔️'].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuickChat(q)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Gửi tin nhắn..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: WebRTC Voice Chat HUD */}
          {activeTab === 'voice' && (
            <div className="flex-1 flex flex-col p-4 justify-between bg-slate-900/40">
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 shadow-lg transition-all ${
                    isVoiceActive ? 'bg-emerald-500 text-black animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Mic className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Phòng Trò Chuyện Bằng Giọng Nói</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    WebRTC P2P Voice Chat trực tiếp qua Microphone trình duyệt.
                  </p>
                </div>

                {/* Voice Status & Controls */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Trạng thái:</span>
                    <span className={`font-bold ${isVoiceActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isVoiceActive ? 'Đang kết nối Voice' : 'Chưa bật Voice'}
                    </span>
                  </div>
                  {isVoiceActive && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Microphone:</span>
                      <button
                        onClick={() => {
                          if (voiceManager) {
                            const muted = voiceManager.toggleMute();
                            setIsMicMuted(muted);
                          }
                        }}
                        className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                          isMicMuted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {isMicMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        <span>{isMicMuted ? 'Đang tắt mic' : 'Đang bật mic'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleToggleVoice}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                  isVoiceActive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                }`}
              >
                {isVoiceActive ? 'Tắt Voice Chat' : 'Bật Voice Chat Trực Tiếp'}
              </button>
            </div>
          )}

          {/* TAB 3: Move History / Notation */}
          {activeTab === 'history' && (
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {moveHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between font-mono"
                  >
                    <span className="text-slate-500">{m.ply}.</span>
                    <span className="text-amber-300 font-bold">{m.notation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar Bottom (Resign, Draw OR Exit Spectator) */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            {isSpectator ? (
              <button
                onClick={handleExitMatch}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-900/60 to-slate-800 hover:from-red-800 hover:to-slate-700 text-red-200 font-extrabold text-xs flex items-center justify-center gap-2 border border-red-800/40 transition-all shadow active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Rời Khán Đài (Thoát Xem)</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleResign}
                  disabled={gameState?.gameOver}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-40"
                >
                  <Flag className="w-3.5 h-3.5" /> Chịu Thua
                </button>
                <button
                  onClick={() => {
                    setGameState(game.init());
                    setClocks({ 0: 600, 1: 600 });
                    setMoveHistory([]);
                    sound.playClick();
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Ván Mới
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* In-Game Rules Guide Modal */}
      <GameGuideModal
        gameId={gameId}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
