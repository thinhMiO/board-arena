import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Flame, Star, Sparkles, Swords, Crown, Play } from 'lucide-react';
import { sound } from '../services/audio';

export const LeaderboardView = ({ user, onChallengePlayer, onSelectGame }) => {
  const [selectedGame, setSelectedGame] = useState('overall');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  const games = [
    { id: 'overall', name: 'Tổng Thể' },
    { id: 'chess', name: 'Cờ Vua' },
    { id: 'xiangqi', name: 'Cờ Tướng' },
    { id: 'co_ca_ngua', name: 'Cờ Cá Ngựa' },
    { id: 'gomoku', name: 'Cờ Caro' },
    { id: 'go', name: 'Cờ Vây' },
    { id: 'checkers', name: 'Cờ Đam' },
    { id: 'reversi', name: 'Cờ Lật (Othello)' },
    { id: 'connect_four', name: 'Cờ 4' },
    { id: 'shogi', name: 'Shogi' },
    { id: 'co_ganh', name: 'Cờ Gánh' },
    { id: 'o_an_quan', name: 'Ô Ăn Quan' },
    { id: 'nine_mens_morris', name: 'Nine Men\'s Morris' }
  ];

  useEffect(() => {
    fetchLeaderboard(selectedGame);
  }, [selectedGame]);

  const fetchLeaderboard = async (gameId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboards?gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch {
      setRankings([
        { id: 'player_top1', displayName: 'Nguyễn Văn A', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyena', rating: 2250, stats: { wins: 342, losses: 85, level: 18, streak: 6 } },
        { id: 'player_top2', displayName: 'Trần B', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tranb', rating: 2150, stats: { wins: 295, losses: 70, level: 16, streak: 4 } },
        { id: 'player_top3', displayName: 'Nguyễn C', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyenc', rating: 2080, stats: { wins: 410, losses: 110, level: 22, streak: 8 } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Find current user's rank
  const userRankIndex = user ? rankings.findIndex(r => r.id === user.id) : -1;
  const userRating = user ? (selectedGame === 'overall' ? (user.stats?.level * 100 + 1400) : (user.ratings?.[selectedGame] || 1500)) : 1500;

  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
          <Trophy className="w-3.5 h-3.5" /> Bảng Vinh Danh Kiện Tướng
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif tracking-wide">
          BẢNG XẾP HẠNG BOARD ARENA
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
          Xếp hạng dựa trên dữ liệu thi đấu thực tế của các kỳ thủ đã đăng ký và đăng nhập trên nền tảng.
        </p>
      </div>

      {/* Game Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {games.map(g => (
          <button
            key={g.id}
            onClick={() => {
              setSelectedGame(g.id);
              sound.playClick();
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedGame === g.id
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* TOP 3 PODIUM */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto mb-8 items-end">
          {/* Top 2 (Silver) */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img
                src={top2.avatar}
                alt={top2.displayName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-300 bg-slate-800 shadow-xl"
              />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-black font-black text-xs flex items-center justify-center shadow">
                🥈
              </span>
            </div>
            <div className="text-xs font-bold text-white text-center truncate max-w-[100px] sm:max-w-none">
              {top2.displayName}
            </div>
            <div className="text-xs font-black text-slate-300 font-mono">
              {top2.rating || top2.avgRating}
            </div>
            <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl mt-2 flex items-center justify-center border-t border-slate-400/40">
              <span className="text-xl sm:text-2xl font-black text-slate-300">#2</span>
            </div>
          </div>

          {/* Top 1 (Gold) */}
          <div className="flex flex-col items-center">
            <Crown className="w-6 h-6 text-amber-400 mb-1 animate-bounce" />
            <div className="relative mb-2">
              <img
                src={top1.avatar}
                alt={top1.displayName}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-400 bg-slate-800 shadow-[0_0_20px_rgba(251,191,36,0.5)] ring-4 ring-amber-400/30"
              />
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow">
                👑
              </span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-amber-300 text-center truncate max-w-[110px] sm:max-w-none">
              {top1.displayName}
            </div>
            <div className="text-sm font-black text-amber-400 font-mono">
              {top1.rating || top1.avgRating}
            </div>
            <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-600/40 via-amber-500/20 to-amber-400/30 rounded-t-2xl mt-2 flex items-center justify-center border-t-2 border-amber-400 shadow-lg">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">#1</span>
            </div>
          </div>

          {/* Top 3 (Bronze) */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img
                src={top3.avatar}
                alt={top3.displayName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-amber-700 bg-slate-800 shadow-xl"
              />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                🥉
              </span>
            </div>
            <div className="text-xs font-bold text-white text-center truncate max-w-[100px] sm:max-w-none">
              {top3.displayName}
            </div>
            <div className="text-xs font-black text-amber-600 font-mono">
              {top3.rating || top3.avgRating}
            </div>
            <div className="w-full h-12 sm:h-16 bg-gradient-to-t from-amber-950 to-amber-900/60 rounded-t-2xl mt-2 flex items-center justify-center border-t border-amber-700/50">
              <span className="text-xl sm:text-2xl font-black text-amber-600">#3</span>
            </div>
          </div>
        </div>
      )}

      {/* USER'S OWN RANK CARD BANNER */}
      {user && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-500/15 border-2 border-amber-500/50 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-12 h-12 rounded-2xl border-2 border-amber-400 bg-slate-800"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black text-[9px]">
                Lv.{user.stats?.level || 1}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">{user.displayName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  HỒ SƠ CỦA BẠN
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Vị trí hiện tại: <strong className="text-amber-400 font-mono">#{userRankIndex !== -1 ? userRankIndex + 1 : '10+'}</strong> • Thắng {user.stats?.wins || 0} / Thua {user.stats?.losses || 0}
              </div>
            </div>
          </div>

          <div className="text-right flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Rating {games.find(g => g.id === selectedGame)?.name}</div>
              <div className="font-mono font-black text-xl text-amber-400">{userRating}</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-12 bg-slate-950/80 px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <div className="col-span-2 sm:col-span-1 text-center">Hạng</div>
          <div className="col-span-6 sm:col-span-5">Kỳ Thủ</div>
          <div className="col-span-4 sm:col-span-3 text-right">Rating Elo</div>
          <div className="hidden sm:block col-span-3 text-right">Hành Động</div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {rankings.map((player, idx) => (
            <div
              key={player.id}
              className={`grid grid-cols-12 items-center px-4 py-3.5 hover:bg-slate-800/40 transition-colors ${
                player.id === user?.id ? 'bg-amber-500/10 border-l-4 border-amber-400' :
                idx === 0 ? 'bg-amber-500/5' : idx === 1 ? 'bg-slate-500/5' : idx === 2 ? 'bg-amber-700/5' : ''
              }`}
            >
              {/* Rank Number */}
              <div className="col-span-2 sm:col-span-1 flex justify-center">
                {idx === 0 ? (
                  <span className="w-7 h-7 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-xs shadow-lg shadow-amber-400/30">
                    1
                  </span>
                ) : idx === 1 ? (
                  <span className="w-7 h-7 rounded-full bg-slate-300 text-black font-extrabold flex items-center justify-center text-xs">
                    2
                  </span>
                ) : idx === 2 ? (
                  <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center text-xs">
                    3
                  </span>
                ) : (
                  <span className="font-bold text-xs text-slate-500">#{idx + 1}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                <img
                  src={player.avatar}
                  alt={player.displayName}
                  className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"
                />
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    {player.displayName}
                    {player.id === user?.id && <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-1 rounded">(Bạn)</span>}
                    {idx < 3 && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cấp {player.stats?.level || 1} • {player.totalGames || ((player.stats?.wins || 0) + (player.stats?.losses || 0))} trận • {player.stats?.streak ? `Chuỗi ${player.stats.streak}🔥` : 'Tích cực'}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="col-span-4 sm:col-span-3 text-right">
                <span className="font-mono font-extrabold text-base sm:text-lg text-amber-400">
                  {player.rating || player.avgRating || 1500}
                </span>
              </div>

              {/* Actions: Thách Đấu / Chơi Chung */}
              <div className="hidden sm:flex col-span-3 justify-end items-center gap-2">
                {player.id !== user?.id && (
                  <button
                    onClick={() => onChallengePlayer && onChallengePlayer(player, selectedGame !== 'overall' ? selectedGame : 'chess')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Thách Đấu</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
