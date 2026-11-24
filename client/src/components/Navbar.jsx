import React from 'react';
import { Crown, Volume2, VolumeX, Trophy, Swords, User, LogIn, Sparkles, Eye } from 'lucide-react';
import { sound } from '../services/audio';

export const Navbar = ({ user, onOpenAuth, onOpenProfile, onNavigate, currentTab, isSoundOn, onToggleSound }) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('lobby')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Crown className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-serif">
              BOARD ARENA
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ĐA TRÒ CHƠI
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onNavigate('lobby')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'lobby'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Sảnh Trò Chơi
          </button>
          <button
            onClick={() => onNavigate('spectate')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'spectate'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-4 h-4 text-red-400" /> Khán Đài (Xem Đấu)
          </button>
          <button
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'leaderboard'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" /> Bảng Xếp Hạng
          </button>
          <button
            onClick={() => onNavigate('tournaments')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'tournaments'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Swords className="w-4 h-4" /> Giải Đấu
          </button>
        </nav>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={isSoundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors border border-slate-700/60"
          >
            {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
          </button>

          {/* User Profile or Login */}
          {user && !user.isGuest && !user.id?.startsWith('guest_') ? (
            <div
              onClick={onOpenProfile}
              title="Xem hồ sơ & bạn bè"
              className="flex items-center gap-2.5 pl-2 border-l border-slate-800 cursor-pointer group hover:opacity-90 active:scale-95 transition-all"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-9 h-9 rounded-full border-2 border-amber-400 bg-slate-800 shadow group-hover:ring-2 group-hover:ring-amber-400"
                />
                <span className="absolute -bottom-1 -right-1 px-1 rounded-full bg-amber-500 text-black font-black text-[8px]">
                  Lv.{user.stats?.level || 1}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span>Chính thức</span> <span>✅</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {user && (
                <div
                  onClick={onOpenProfile}
                  title="Hồ sơ khách"
                  className="hidden sm:flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 text-xs font-medium mr-1"
                >
                  <img src={user.avatar} className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700" alt="guest" />
                  <span className="truncate max-w-[80px]">{user.displayName}</span>
                </div>
              )}
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Đăng Ký / Đăng Nhập</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
