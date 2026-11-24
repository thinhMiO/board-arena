import React, { useState, useEffect } from 'react';
import {
  Eye, Radio, Users, Swords, Trophy, Search, Play, ArrowRight,
  Sparkles, RefreshCw, Clock, Flame
} from 'lucide-react';
import { sound } from '../services/audio';

export const LiveSpectatorView = ({ onSpectateRoom, onNavigateToLobby }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customRoomCode, setCustomRoomCode] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickWatch = (e) => {
    e.preventDefault();
    if (!customRoomCode.trim()) return;
    const code = customRoomCode.trim().toUpperCase();
    onSpectateRoom({ code });
  };

  // Filter rooms: ongoing playing matches first, or any active room
  const livePlayingRooms = rooms.filter(r => r.status === 'playing');
  const waitingRooms = rooms.filter(r => r.status === 'waiting');
  const allDisplayRooms = [...livePlayingRooms, ...waitingRooms];

  const filteredRooms = allDisplayRooms.filter(r => {
    const matchesCat = selectedCategory === 'all' || r.gameId === selectedCategory;
    const matchesQuery = !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.gameName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.players?.some(p => p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const totalSpectators = rooms.reduce((acc, r) => acc + (r.spectators?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* HEADER HERO */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-amber-500/30 p-6 sm:p-8 mb-8 shadow-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <Eye className="w-3.5 h-3.5" />
              <span>Khán Đài Trực Tiếp Đang Mở</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight">
              THEO DÕI TRẬN ĐẤU
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Theo dõi trực tiếp các trận đấu đỉnh cao của các kỳ thủ trên toàn hệ thống trong thời gian thực. Quan sát nước đi, đồng hồ thi đấu, phân tích thế trận và cổ vũ qua khung trò chuyện.
            </p>

            {/* Quick Stats */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Bàn đang đấu: <strong className="text-amber-300">{livePlayingRooms.length}</strong></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Khán giả trực tiếp: <strong className="text-emerald-300">{totalSpectators}</strong></span>
              </div>
              <button
                onClick={fetchRooms}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Quick Enter Room Code Card */}
          <div className="w-full md:w-80 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl shrink-0">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Bằng Mã Bàn</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Nhập mã bàn 6 ký tự để vào khán đài xem ván đấu của bạn bè.
            </p>
            <form onSubmit={handleQuickWatch} className="flex gap-2">
              <input
                type="text"
                placeholder="MÃ BÀN (VD: X9Y2Z1)"
                value={customRoomCode}
                onChange={e => setCustomRoomCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs transition-all shadow shrink-0 flex items-center gap-1 active:scale-95"
              >
                <span>Xem</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Tất Cả Môn Cờ' },
            { id: 'chess', label: '♔ Cờ Vua' },
            { id: 'co_ca_ngua', label: '🐎 Cờ Cá Ngựa 3D' },
            { id: 'xiangqi', label: '🔴 Cờ Tướng' },
            { id: 'go', label: '⚫ Cờ Vây' },
            { id: 'gomoku', label: '❌ Cờ Caro' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên bàn, kỳ thủ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* MATCHES GRID */}
      {filteredRooms.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800 max-w-xl mx-auto">
          <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">Hiện không có ván đấu nào phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Hãy tạo phòng hoặc tham gia thi đấu để trận đấu của bạn xuất hiện trên khán đài!
          </p>
          <button
            onClick={onNavigateToLobby}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow"
          >
            Quay Về Sảnh Trò Chơi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map(room => {
            const isPlaying = room.status === 'playing';
            const p1 = room.players?.[0];
            const p2 = room.players?.[1];
            const specCount = room.spectators?.length || 0;

            return (
              <div
                key={room.code}
                className="glass-panel rounded-3xl p-5 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-xl group hover:shadow-2xl hover:shadow-amber-500/10"
              >
                <div>
                  {/* Top Bar: Game Name & Live Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {room.gameName || 'Trò Cờ'}
                    </span>
                    <div className="flex items-center gap-2">
                      {isPlaying ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          <span>TRỰC TIẾP</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Sắp diễn ra
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>{specCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* Room Name */}
                  <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-4">
                    {room.name}
                  </h3>

                  {/* Versus Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-4">
                    <div className="flex items-center justify-between">
                      {/* Player 1 */}
                      <div className="flex items-center gap-2.5 max-w-[42%]">
                        <img
                          src={p1?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1'}
                          alt={p1?.displayName || 'P1'}
                          className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-500/60 shrink-0"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {p1?.displayName || 'Chờ đối thủ'}
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono">
                            Elo {p1?.rating || 1500}
                          </div>
                        </div>
                      </div>

                      {/* VS Center Badge */}
                      <div className="px-2 py-1 rounded-xl bg-slate-800/90 text-[10px] font-black text-slate-400 border border-slate-700 shrink-0">
                        VS
                      </div>

                      {/* Player 2 */}
                      <div className="flex items-center gap-2.5 max-w-[42%] justify-end text-right">
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {p2?.displayName || (isPlaying ? 'Đối thủ' : 'Đang đợi...')}
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono">
                            {p2 ? `Elo ${p2.rating || 1500}` : '---'}
                          </div>
                        </div>
                        <img
                          src={p2?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2'}
                          alt={p2?.displayName || 'P2'}
                          className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/60 shrink-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Room Meta (Code, Time) */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-4 px-1">
                    <span>Mã bàn: <strong className="text-amber-400">{room.code}</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{room.timerPreset || '10+0'}</span>
                    </span>
                  </div>
                </div>

                {/* Spectate Button */}
                <button
                  onClick={() => {
                    sound.playClick();
                    onSpectateRoom(room);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white hover:text-black font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Vào Xem Trận Đấu Này</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
