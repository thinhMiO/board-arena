import React, { useState, useEffect, useRef } from 'react';
import { BoardRenderer } from './boards/BoardRenderer';
import { GameRegistry } from '@shared/games/index.js';
import { sound } from '../services/audio';
import { VoiceChatManager } from '../services/webrtc';
import { socketService } from '../services/socket';
import {
  ArrowLeft, Mic, MicOff, Volume2, VolumeX, MessageSquare, Flag,
  RotateCcw, History, Copy, Check, Send, Smile, Users, Radio, BookOpen, Eye, Share2
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
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history' | 'voice'
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Clocks
  const [clocks, setClocks] = useState(() => {
    if (matchConfig?.room?.timer?.clocks) {
      return matchConfig.room.timer.clocks;
    }
    return { 0: 600, 1: 600 };
  });
  const [clockRunning, setClockRunning] = useState(false);

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

  // Voice Chat
  const [voiceManager, setVoiceManager] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceRoster, setVoiceRoster] = useState([]);
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());

  // Handle exiting room cleanly
  const handleExitMatch = () => {
    if (roomCode) {
      socketService.emit('room:leave', { roomCode });
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

  // Timer loop
  useEffect(() => {
    if (!clockRunning || (gameState && gameState.gameOver)) return;
    const interval = setInterval(() => {
      setClocks(prev => {
        const active = gameState.turn;
        const nextTime = Math.max(0, prev[active] - 1);
        if (nextTime === 0 && !gameState.gameOver) {
          handleGameOver(1 - active, 'Hết thời gian thi đấu!');
        }
        return { ...prev, [active]: nextTime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [clockRunning, gameState]);

  // Socket room listeners
  useEffect(() => {
    if (mode === 'online' && roomCode) {
      const s = socketService.getSocket();
      s.on('game:move_made', ({ move, notation, playerIndex, gameState: newGs, timer }) => {
        setGameState(newGs);
        if (timer?.clocks) setClocks(timer.clocks);
        setMoveHistory(prev => [...prev, { ply: prev.length + 1, notation }]);
        sound.playMove();
      });

      s.on('game:started', ({ gameState: startGs, timer }) => {
        setGameState(startGs);
        if (timer?.clocks) setClocks(timer.clocks);
        setMoveHistory([]);
        sound.playVictory();
      });

      s.on('game:ended', ({ winnerIndex, reason }) => {
        handleGameOver(winnerIndex, reason);
      });

      s.on('spectators:updated', ({ count, spectators: specList }) => {
        setSpectators(specList || []);
      });

      s.on('room:updated', updatedRoom => {
        setRoomData(updatedRoom);
        if (updatedRoom.spectators) setSpectators(updatedRoom.spectators);
        if (updatedRoom.gameState) setGameState(updatedRoom.gameState);
        if (updatedRoom.timer?.clocks) setClocks(updatedRoom.timer.clocks);
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
    if (!game || !gameState || gameState.gameOver) return;

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
      sound.playMove();

      if (res.result && res.result.over) {
        handleGameOver(res.result.winner, res.result.reason);
      }
    }
  };

  const handleGameOver = (winnerIndex, reason) => {
    sound.playVictory();
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
    setGameState(prev => ({ ...prev, gameOver: true, winner: winnerIndex }));
    setClockRunning(false);
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'HỆ THỐNG', isSystem: true, text: `🏆 Trận đấu kết thúc: ${reason}` }
    ]);

    // Record match to database for logged in user to update Elo and Leaderboard
    if (user?.id && !isSpectator) {
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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

  const isWaitingForOpponent = mode === 'online' && !isSpectator && (!roomData?.players || roomData.players.length < 2 || roomData?.status === 'waiting');

  const player0 = isSpectator
    ? (roomData?.players?.[0] || { displayName: 'Người chơi 1 (Đỏ/Trắng)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1', rating: 1500 })
    : (user || { displayName: 'Bạn', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user', rating: 1500 });

  const player1 = isSpectator
    ? (roomData?.players?.[1] || { displayName: 'Người chơi 2 (Đen/Vàng)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2', rating: 1500 })
    : (mode === 'ai'
        ? { displayName: `AI (${difficulty})`, avatar: null, rating: 1500 }
        : (matchConfig?.opponent || roomData?.players?.find(p => p.id !== user?.id) || { displayName: 'Đối Thủ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=opponent', rating: 1500 }));

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
                      className={`w-9 h-9 rounded-full border-2 ${gameState?.turn === 1 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700'}`}
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-full bg-slate-800 border-2 flex items-center justify-center font-bold text-sm ${gameState?.turn === 1 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700'}`}>
                      {player1.avatar || (mode === 'ai' ? '🤖' : '👤')}
                    </div>
                  )}
                  {activeSpeakers.has('opponent') && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {player1.displayName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {getSideName(gameId, 1)}
                    </span>
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
                {formatTime(clocks[1])}
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
            </div>
          )}

          {/* ACTIVE TURN HUD BANNER */}
          <div className="w-[min(86vw,min(68vh,500px))] mb-1.5">
            {gameState?.gameOver ? (
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 text-center shadow-xl">
                <span className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-wide">
                  🏆 Trận Đấu Đã Kết Thúc
                </span>
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
                isInteractive={!isSpectator && !gameState.gameOver && (mode === 'pass_play' || gameState.turn === myPlayerIndex)}
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
                  className={`w-9 h-9 rounded-full border-2 ${gameState?.turn === 0 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700'}`}
                />
                {activeSpeakers.has('me') && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{player0.displayName}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {getSideName(gameId, 0)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Rating: {player0.rating || 1500}
                </div>
              </div>
            </div>

            {/* User Clock */}
            <div className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${gameState?.turn === 0 ? 'bg-amber-500 text-black animate-pulse-fast' : 'bg-slate-900 text-slate-300'}`}>
              {formatTime(clocks[0])}
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
                  onClick={() => handleGameOver(1 - myPlayerIndex, 'Người chơi đã chịu thua (Resign).')}
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
