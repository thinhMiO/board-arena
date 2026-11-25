import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GameCard } from './components/GameCard';
import { PlayModal } from './components/PlayModal';
import { GameBoardView } from './components/GameBoardView';
import { LeaderboardView } from './components/LeaderboardView';
import { TournamentView } from './components/TournamentView';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GameGuideModal } from './components/GameGuideModal';
import { LiveSpectatorView } from './components/LiveSpectatorView';
import { GameRegistry } from '@shared/games/index.js';
import { socketService } from './services/socket';
import { sound } from './services/audio';
import {
  Trophy, Swords, Users, Play, Sparkles, Search, Compass, ShieldAlert,
  Globe, LogIn, KeyRound, Radio, ArrowRight, UserPlus, Eye
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState('lobby'); // 'lobby' | 'spectate' | 'leaderboard' | 'tournaments' | 'game'
  const [user, setUser] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [playModalDefaultTab, setPlayModalDefaultTab] = useState('ai');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [matchConfig, setMatchConfig] = useState(null);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [guideGameId, setGuideGameId] = useState(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Multiplayer Public Rooms
  const [publicRooms, setPublicRooms] = useState([]);
  const [quickRoomCode, setQuickRoomCode] = useState('');

  // Auto-connect socket & check local user
  useEffect(() => {
    socketService.connect();
    const savedToken = localStorage.getItem('board_arena_token');
    const savedUser = localStorage.getItem('board_arena_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        socketService.emit('auth:init', u);
      } catch {}
    } else {
      // Auto login as guest
      fetch('/api/auth/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('board_arena_user', JSON.stringify(data.user));
            socketService.emit('auth:init', data.user);
          }
        }).catch(() => {});
    }

    // Fetch initial live rooms
    fetch('/api/rooms')
      .then(res => res.json())
      .then(rooms => setPublicRooms(rooms || []))
      .catch(() => {});

    // Check URL parameters for direct invite link (?room=CODE or ?spectate=CODE)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room') || urlParams.get('code') || urlParams.get('join');
      const spectateParam = urlParams.get('spectate');
      if (roomParam) {
        setTimeout(() => {
          handleStartMatch({
            mode: 'join_room',
            roomCode: roomParam.trim().toUpperCase(),
            gameId: 'chess'
          });
        }, 600);
      } else if (spectateParam) {
        setTimeout(() => {
          handleStartMatch({
            mode: 'spectate',
            roomCode: spectateParam.trim().toUpperCase(),
            gameId: 'chess'
          });
        }, 600);
      }
    } catch {}

    // Socket listeners for matchmaking & room events
    const s = socketService.getSocket();
    s.on('matchmaking:matched', ({ roomCode, opponent }) => {
      setMatchConfig({
        gameId: selectedGame ? selectedGame.id : 'chess',
        mode: 'online',
        roomCode,
        opponent
      });
      setCurrentTab('game');
      sound.playVictory();
    });

    s.on('lobby:room_created', newRoom => {
      setPublicRooms(prev => [newRoom, ...prev.filter(r => r.code !== newRoom.code)]);
    });

    s.on('lobby:room_removed', removedCode => {
      setPublicRooms(prev => prev.filter(r => r.code !== removedCode));
    });

    s.on('friend:game_invite', invite => {
      sound.playVictory();
      setIncomingInvite(invite);
    });

    return () => {
      s.off('matchmaking:matched');
      s.off('lobby:room_created');
      s.off('lobby:room_removed');
      s.off('friend:game_invite');
    };
  }, [selectedGame]);

  const allGames = GameRegistry.getAll();

  const filteredGames = allGames.filter(g => {
    const matchesCat = categoryFilter === 'all' || g.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      g.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) || 
      g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenPlayModal = (game, tab = 'ai') => {
    setSelectedGame(game);
    setPlayModalDefaultTab(tab);
    setIsPlayModalOpen(true);
    sound.playClick();
  };

  const handleStartMatch = config => {
    setMatchConfig(config);
    if (config.mode === 'create_room') {
      socketService.emit('room:create', {
        name: config.roomName,
        gameId: config.gameId,
        isPrivate: config.isPrivate,
        password: config.password,
        timerPreset: config.timeControl,
        user
      }, res => {
        if (res.success) {
          if (config.inviteUserId) {
            socketService.emit('friend:invite', {
              toUserId: config.inviteUserId,
              roomCode: res.room.code,
              gameId: config.gameId,
              gameName: GameRegistry.get(config.gameId)?.nameVi || 'Bàn Cờ'
            });
          }
          setMatchConfig({
            gameId: config.gameId,
            mode: 'online',
            roomCode: res.room.code,
            room: res.room,
            role: 'player',
            playerIndex: 0
          });
          setCurrentTab('game');
          sound.playVictory();
        } else {
          alert(res.error || 'Lỗi khi tạo phòng');
        }
      });
    } else if (config.mode === 'join_room' || config.mode === 'spectate') {
      const isSpectateMode = config.mode === 'spectate';
      socketService.emit('room:join', {
        roomCode: config.roomCode,
        password: config.password,
        user,
        role: isSpectateMode ? 'spectator' : undefined
      }, res => {
        if (res.success) {
          setMatchConfig({
            gameId: res.room.gameId || config.gameId,
            mode: 'online',
            roomCode: res.room.code,
            isSpectator: res.role === 'spectator' || isSpectateMode,
            role: res.role,
            room: res.room,
            playerIndex: res.playerIndex
          });
          setCurrentTab('game');
          sound.playVictory();
        } else {
          if (res.error?.includes('mật khẩu') || res.error?.includes('Mật khẩu')) {
            const enteredPwd = prompt('🔒 Bàn này có đặt mật khẩu bảo vệ. Vui lòng nhập đúng mật khẩu phòng:');
            if (enteredPwd !== null && enteredPwd.trim().length > 0) {
              handleStartMatch({
                ...config,
                password: enteredPwd.trim()
              });
              return;
            }
            // Người dùng bấm Hủy (Cancel) hoặc không nhập: dừng lại, không hiện alert lỗi khó chịu
            return;
          }
          alert(res.error || 'Không thể tham gia phòng');
        }
      });
    } else if (config.mode === 'matchmaking') {
      socketService.emit('matchmaking:find', {
        gameId: config.gameId,
        timeControl: config.timeControl,
        user
      });
      alert(`Đang tìm kiếm đối thủ xứng tầm cho môn ${selectedGame?.nameVi || 'Cờ'}... Bạn sẽ được chuyển vào bàn ngay khi tìm thấy!`);
    } else {
      // Offline / AI
      setCurrentTab('game');
    }
  };

  // Quick join by room code
  const handleQuickJoinRoom = (e) => {
    e.preventDefault();
    if (!quickRoomCode.trim()) return;
    const code = quickRoomCode.trim().toUpperCase();
    handleStartMatch({
      mode: 'join_room',
      roomCode: code,
      gameId: 'chess'
    });
  };

  // Challenge player from leaderboard
  const handleChallengePlayer = (player, gameId) => {
    const gameObj = allGames.find(g => g.id === gameId) || allGames[0];
    setSelectedGame(gameObj);
    handleStartMatch({
      mode: 'create_room',
      gameId: gameObj.id,
      roomName: `Đấu với ${player.displayName}`,
      isPrivate: false,
      timeControl: '10+0'
    });
  };

  // Invite friend from profile
  const handleInviteFriend = (friend) => {
    const gameObj = selectedGame || allGames[0];
    handleStartMatch({
      mode: 'create_room',
      gameId: gameObj.id,
      roomName: `Phòng mời ${friend.displayName}`,
      isPrivate: false,
      timeControl: '10+0',
      inviteUserId: friend.id
    });
  };

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setIsSoundOn(next);
  };

  const handleAuthSuccess = data => {
    setUser(data.user);
    localStorage.setItem('board_arena_token', data.token);
    localStorage.setItem('board_arena_user', JSON.stringify(data.user));
    socketService.emit('auth:init', data.user);
  };

  const handleUpdateUser = updated => {
    setUser(updated);
    localStorage.setItem('board_arena_user', JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem('board_arena_token');
    localStorage.removeItem('board_arena_user');
    setUser(null);
    setIsAuthModalOpen(true);
    sound.playClick();
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigate={tab => setCurrentTab(tab)}
        currentTab={currentTab}
        isSoundOn={isSoundOn}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 pb-12">
        {currentTab === 'game' && matchConfig ? (
          <GameBoardView
            key={`${matchConfig.mode}_${matchConfig.roomCode || matchConfig.gameId}_${matchConfig.room?.createdAt || ''}`}
            matchConfig={matchConfig}
            user={user}
            onExitMatch={() => { setCurrentTab('lobby'); setMatchConfig(null); }}
            onUserUpdated={handleUpdateUser}
          />
        ) : currentTab === 'spectate' ? (
          <LiveSpectatorView
            onSpectateRoom={(room) => {
              handleStartMatch({
                mode: 'spectate',
                roomCode: room.code,
                gameId: room.gameId || 'chess'
              });
            }}
            onNavigateToLobby={() => setCurrentTab('lobby')}
          />
        ) : currentTab === 'leaderboard' ? (
          <LeaderboardView
            user={user}
            onChallengePlayer={handleChallengePlayer}
          />
        ) : currentTab === 'tournaments' ? (
          <TournamentView
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        ) : (
          /* SẢNH CHÍNH (LOBBY VIEW) */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            
            {/* HERO PROMOTIONAL BANNER */}
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-amber-500/20 p-6 sm:p-10 mb-8 shadow-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Nền Tảng Chơi Cờ Trực Tuyến Đa Năng #1
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
                  BOARD ARENA
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  Chơi hơn 12 loại cờ truyền thống và quốc tế trên cùng một tài khoản. Hỗ trợ đầy đủ Online, Offline, đấu với máy bằng AI thông minh, Voice Chat P2P và xếp hạng Elo toàn diện.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleOpenPlayModal(allGames[0])}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Chơi Nhanh Cờ Vua</span>
                  </button>
                  <button
                    onClick={() => handleOpenPlayModal(allGames[10] || allGames[1])}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Cờ Cá Ngựa 3D</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('spectate')}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Khán Đài Xem Đấu</span>
                  </button>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-slate-700 transition-all flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Hồ Sơ & Bạn Bè</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MULTIPLAYER / PLAY TOGETHER ACTION HUB */}
            <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Join Room by Code */}
              <div className="p-5 rounded-3xl glass-panel border border-slate-700/80 bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">Chơi Chung Bằng Mã Phòng</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nhập mã phòng do bạn bè chia sẻ để tham gia trận đấu ngay tức thì.
                  </p>
                </div>
                <form onSubmit={handleQuickJoinRoom} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="MÃ PHÒNG (VD: A1B2C3)"
                    value={quickRoomCode}
                    onChange={e => setQuickRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Vào</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Card 2: Create Custom Room */}
              <div className="p-5 rounded-3xl glass-panel border border-slate-700/80 bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">Tạo Phòng Chơi Mới</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thiết lập bàn cờ riêng, tuỳ chỉnh thời gian, mật khẩu và mời bạn bè vào đấu.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenPlayModal(allGames[0], 'create_room')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Globe className="w-4 h-4" />
                  <span>Chọn Cờ & Tạo Phòng</span>
                </button>
              </div>

              {/* Card 3: Leaderboard & Challenge */}
              <div className="p-5 rounded-3xl glass-panel border border-slate-700/80 bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">Bảng Xếp Hạng Kỳ Thủ</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Xem thứ hạng của bạn, bảng Elo theo từng môn cờ và thách đấu các cao thủ.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('leaderboard')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Xem Bảng Xếp Hạng</span>
                </button>
              </div>
            </div>

            {/* LIVE PUBLIC ROOMS LIST (IF ANY) */}
            {publicRooms.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      Phòng Chơi Trực Tuyến Đang Mở ({publicRooms.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Tự động cập nhật</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {publicRooms.slice(0, 6).map(room => {
                    const isPlaying = room.status === 'playing';
                    return (
                      <div
                        key={room.code}
                        className="p-3.5 rounded-2xl glass-panel border border-slate-800 hover:border-amber-500/50 transition-colors flex items-center justify-between shadow gap-2"
                      >
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-xs text-white truncate flex items-center gap-1">
                              <span>{room.name}</span>
                              {room.hasPassword && <span title="Bàn có mật khẩu" className="text-amber-400 text-xs">🔒</span>}
                            </span>
                            {isPlaying && (
                              <span className="shrink-0 flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Mã: <strong className="text-amber-400">{room.code}</strong> • {room.gameName || 'Cờ'} • {room.spectators?.length || 0} xem
                          </div>
                        </div>

                        {isPlaying ? (
                          <button
                            onClick={() => handleStartMatch({ mode: 'spectate', roomCode: room.code, gameId: room.gameId })}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs transition-all shadow flex items-center gap-1 shrink-0 active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                if (room.hasPassword) {
                                  const pwd = prompt(`🔒 Bàn "${room.name}" có cài mật khẩu bảo vệ. Vui lòng nhập mật khẩu:`);
                                  if (pwd === null) return;
                                  if (!pwd.trim()) {
                                    alert('Vui lòng nhập mật khẩu để vào bàn!');
                                    return;
                                  }
                                  handleStartMatch({ mode: 'join_room', roomCode: room.code, gameId: room.gameId, password: pwd.trim() });
                                } else {
                                  handleStartMatch({ mode: 'join_room', roomCode: room.code, gameId: room.gameId });
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow"
                            >
                              Tham Gia
                            </button>
                            <button
                              onClick={() => handleStartMatch({ mode: 'spectate', roomCode: room.code, gameId: room.gameId })}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                              title="Xem trực tiếp"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEARCH & CATEGORY FILTER TABS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'all', label: 'Tất Cả Game' },
                  { id: 'strategy', label: 'Cờ Chiến Thuật' },
                  { id: 'vietnamese', label: 'Dân Gian Việt Nam' },
                  { id: 'traditional', label: 'Cờ Truyền Thống' },
                  { id: 'casual', label: 'Giải Trí Nhanh' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      categoryFilter === cat.id
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trò cờ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* GAMES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={handleOpenPlayModal}
                  onOpenGuide={id => setGuideGameId(id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      <PlayModal
        game={selectedGame}
        isOpen={isPlayModalOpen}
        defaultTab={playModalDefaultTab}
        onClose={() => setIsPlayModalOpen(false)}
        onStartMatch={handleStartMatch}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <UserProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateUser={handleUpdateUser}
        onInviteFriend={handleInviteFriend}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <GameGuideModal
        gameId={guideGameId}
        isOpen={!!guideGameId}
        onClose={() => setGuideGameId(null)}
      />

      {/* Real-time Game Invitation Banner */}
      {incomingInvite && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full p-4 rounded-2xl glass-panel border-2 border-amber-400 bg-slate-900/95 shadow-2xl animate-fade-in">
          <div className="flex items-start gap-3">
            <img
              src={incomingInvite.fromUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=friend'}
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-amber-400 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>Lời Mời Thi Đấu!</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                <strong className="text-amber-300">{incomingInvite.fromUser?.displayName || 'Bạn bè'}</strong> mời bạn chơi môn <strong className="text-amber-300">{incomingInvite.gameName}</strong>
              </p>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Mã phòng: <strong className="text-amber-400">{incomingInvite.roomCode}</strong>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    const invite = incomingInvite;
                    setIncomingInvite(null);
                    handleStartMatch({
                      mode: 'join_room',
                      roomCode: invite.roomCode,
                      gameId: invite.gameId
                    });
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs shadow flex items-center justify-center gap-1 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Vào Bàn Ngay</span>
                </button>
                <button
                  onClick={() => setIncomingInvite(null)}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
                >
                  Từ Chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
