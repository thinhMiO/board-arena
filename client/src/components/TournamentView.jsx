import React, { useState, useEffect } from 'react';
import {
  Swords, Trophy, Users, Shield, Plus, Award, X, Sparkles,
  Clock, CheckCircle2, Crown, ChevronRight, Play
} from 'lucide-react';
import { sound } from '../services/audio';

const TOURNAMENT_GAMES = [
  { id: 'chess', name: 'Cờ Vua (Chess)', category: 'Chiến Thuật' },
  { id: 'xiangqi', name: 'Cờ Tướng (Xiangqi)', category: 'Chiến Thuật' },
  { id: 'co_ca_ngua', name: 'Cờ Cá Ngựa (Ludo 3D)', category: 'Giải Trí' },
  { id: 'gomoku', name: 'Cờ Caro (Gomoku)', category: 'Chiến Thuật' },
  { id: 'go', name: 'Cờ Vây (Go)', category: 'Chiến Thuật' },
  { id: 'checkers', name: 'Cờ Đam (Checkers)', category: 'Truyền Thống' },
  { id: 'reversi', name: 'Cờ Lật (Othello)', category: 'Chiến Thuật' },
  { id: 'connect_four', name: 'Cờ 4 (Connect Four)', category: 'Giải Trí' },
  { id: 'co_ganh', name: 'Cờ Gánh Việt Nam', category: 'Dân Gian' },
  { id: 'o_an_quan', name: 'Ô Ăn Quan', category: 'Dân Gian' },
  { id: 'shogi', name: 'Cờ Shogi Nhật Bản', category: 'Chiến Thuật' },
  { id: 'nine_mens_morris', name: 'Nine Men\'s Morris', category: 'Truyền Thống' }
];

export const TournamentView = ({ user, onOpenAuth }) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [tourTitle, setTourTitle] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('chess');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [timeControl, setTimeControl] = useState('10+0');
  const [createMsg, setCreateMsg] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const gameObj = TOURNAMENT_GAMES.find(g => g.id === selectedGameId) || TOURNAMENT_GAMES[0];
    const finalTitle = tourTitle.trim() || `Giải Đấu ${gameObj.name}`;

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          gameId: selectedGameId,
          maxPlayers: Number(maxPlayers),
          user
        })
      });

      if (res.ok) {
        const newTour = await res.json();
        setTournaments(prev => [newTour, ...prev]);
        setIsCreateOpen(false);
        setTourTitle('');
        sound.playVictory();
      } else {
        const err = await res.json();
        setCreateMsg(err.error || 'Tạo giải đấu thất bại');
      }
    } catch {
      setCreateMsg('Lỗi kết nối máy chủ');
    }
  };

  const handleJoinTournament = async (tourId) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${tourId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });

      if (res.ok) {
        const updated = await res.json();
        setTournaments(prev => prev.map(t => t.id === tourId ? updated : t));
        sound.playCheck();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể tham gia giải đấu');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Swords className="w-3.5 h-3.5" /> Đấu Trường Đỉnh Cao
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
            HỆ THỐNG GIẢI ĐẤU
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Tổ chức và tham gia các giải đấu cờ trực tuyến với thể thức nhánh đấu loại trực tiếp (Brackets), cúp vô địch và điểm thưởng Elo.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              if (onOpenAuth) onOpenAuth();
            } else {
              setIsCreateOpen(true);
            }
          }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Tạo Giải Đấu Mới</span>
        </button>
      </div>

      {/* Tournaments List */}
      <div className="space-y-6">
        {tournaments.length === 0 ? (
          <div className="p-10 text-center glass-panel rounded-3xl border border-slate-800">
            <Trophy className="w-12 h-12 text-amber-400/60 mx-auto mb-3" />
            <h3 className="font-bold text-white text-base">Chưa có giải đấu nào đang diễn ra</h3>
            <p className="text-xs text-slate-400 mt-1">Hãy bấm nút "Tạo Giải Đấu Mới" để trở thành người khởi xướng giải đấu đầu tiên!</p>
          </div>
        ) : (
          tournaments.map(t => {
            const isUserJoined = user && t.participants?.some(p => p.id === user.id);
            const isFull = t.participants?.length >= t.maxPlayers;

            return (
              <div key={t.id} className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                        {t.gameName}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        t.status === 'registration'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {t.status === 'registration' ? '🟢 Mở Đăng Ký' : '⚔️ Đang Thi Đấu'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white font-serif mt-1.5">
                      {t.title}
                    </h3>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>Thưởng: Cúp Vàng Vô Địch + 5000 XP</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        Tuyển thủ: <strong className="text-white">{t.participants?.length || 1}</strong> / {t.maxPlayers}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {t.status === 'registration' ? (
                      isUserJoined ? (
                        <div className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Bạn Đã Tham Gia</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinTournament(t.id)}
                          disabled={isFull}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isFull ? 'Đã Đủ Người' : 'Tham Gia Ngay ➔'}
                        </button>
                      )
                    ) : (
                      <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                        Xem Bảng Đấu Trực Tiếp
                      </span>
                    )}
                  </div>
                </div>

                {/* Registered Participants or Bracket Matches */}
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Danh Sách Tuyển Thủ Đã Ghi Danh ({t.participants?.length || 1})</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {t.participants?.map((p, pIdx) => (
                      <div
                        key={p.id || pIdx}
                        className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5"
                      >
                        <img
                          src={p.avatar}
                          alt={p.displayName}
                          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{p.displayName}</div>
                          <div className="text-[10px] text-amber-400 font-mono">Elo {p.rating || 1500}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-slate-700/80 p-6 sm:p-8 shadow-2xl bg-slate-900/95 overflow-hidden">
            
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-2 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white font-serif">
                Khởi Tạo Giải Đấu Mới
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tạo giải đấu loại trực tiếp (Brackets) cho bạn bè và cộng đồng cùng tham gia.
              </p>
            </div>

            {createMsg && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold">
                ⚠️ {createMsg}
              </div>
            )}

            <form onSubmit={handleCreateTournament} className="space-y-4">
              {/* Tournament Title */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tên Giải Đấu
                </label>
                <input
                  type="text"
                  placeholder="VD: Cúp Mùa Thu 2026, Đại Chiến Cờ Cá Ngựa..."
                  value={tourTitle}
                  onChange={e => setTourTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Game Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Môn Cờ Thi Đấu
                </label>
                <select
                  value={selectedGameId}
                  onChange={e => setSelectedGameId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {TOURNAMENT_GAMES.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} [{g.category}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Players (Brackets) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Quy Mô Tuyển Thủ (Thể Thức Brackets)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 4, desc: 'Bán Kết & Chung Kết' },
                    { count: 8, desc: 'Tứ Kết ➔ Chung Kết' },
                    { count: 16, desc: 'Vòng 16 ➔ Chung Kết' }
                  ].map(b => (
                    <button
                      type="button"
                      key={b.count}
                      onClick={() => setMaxPlayers(b.count)}
                      className={`py-2.5 px-2 rounded-xl text-center border transition-all ${
                        maxPlayers === b.count
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-black">{b.count} Tuyển Thủ</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Control */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Thời Gian Mỗi Ván Đấu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '5+0', label: '5 phút (Blitz)' },
                    { id: '10+0', label: '10 phút (Chuẩn)' },
                    { id: '15+10', label: '15 phút + 10s' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTimeControl(t.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        timeControl === t.id
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold rounded-2xl shadow-xl transition-all text-sm mt-3 flex items-center justify-center gap-2 active:scale-95"
              >
                <Trophy className="w-5 h-5" />
                <span>Hoàn Tất Khởi Tạo Giải Đấu 🏆</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
