import React, { useState, useEffect } from 'react';
import {
  X, User, Trophy, Users, Shield, Copy, Check, Flame, Award,
  Sparkles, Swords, RefreshCw, UserPlus, Trash2, Globe, Play, LogOut, ShieldAlert
} from 'lucide-react';
import { sound } from '../services/audio';

const GAME_NAMES = {
  chess: 'Cờ Vua',
  xiangqi: 'Cờ Tướng',
  gomoku: 'Cờ Caro',
  go: 'Cờ Vây',
  co_ca_ngua: 'Cờ Cá Ngựa',
  checkers: 'Cờ Đam',
  reversi: 'Cờ Lật (Othello)',
  connect_four: 'Cờ 4',
  shogi: 'Shogi',
  co_ganh: 'Cờ Gánh',
  o_an_quan: 'Ô Ăn Quan',
  nine_mens_morris: 'Nine Men\'s Morris'
};

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=user1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=king',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=queen',
  'https://api.dicebear.com/7.x/bottts/svg?seed=knight',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=dragon',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=samurai'
];

export const UserProfileModal = ({ user, isOpen, onClose, onUpdateUser, onInviteFriend, onOpenAuth, onLogout }) => {
  if (!isOpen || !user) return null;

  const isGuest = user.isGuest || user.id?.startsWith('guest_');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ratings' | 'friends'
  const [isCopied, setIsCopied] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [friendMsg, setFriendMsg] = useState(null);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch(`/api/users/${user.id}/friends`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch {}
    finally {
      setLoadingFriends(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setIsCopied(true);
    sound.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateUser(updated);
        setIsEditingName(false);
        sound.playCheck();
      }
    } catch {}
  };

  const handleChangeAvatar = async (newAvatar) => {
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatar })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateUser(updated);
        sound.playCheck();
      }
    } catch {}
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendQuery.trim()) return;
    setFriendMsg(null);
    try {
      const res = await fetch(`/api/users/${user.id}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: friendQuery.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(prev => [...prev, data.friend]);
        setFriendQuery('');
        setFriendMsg({ type: 'success', text: `Đã kết bạn thành công với ${data.friend.displayName}!` });
        sound.playVictory();
      } else {
        setFriendMsg({ type: 'error', text: data.error || 'Không tìm thấy người chơi' });
      }
    } catch {
      setFriendMsg({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await fetch(`/api/users/${user.id}/friends/${friendId}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f.id !== friendId));
      sound.playClick();
    } catch {}
  };

  const stats = user.stats || {};
  const totalMatches = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
  const winRate = totalMatches > 0 ? Math.round(((stats.wins || 0) / totalMatches) * 100) : 0;
  const xp = stats.xp || 0;
  const level = stats.level || 1;
  const xpCurrent = xp % 1000;
  const xpProgress = Math.min(100, Math.round((xpCurrent / 1000) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel border border-slate-700/80 p-6 shadow-2xl overflow-hidden bg-slate-900/95 max-h-[90vh] flex flex-col">
        
        {/* Header Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header Hero */}
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-800 shrink-0">
          {/* Avatar with quick selector */}
          <div className="relative group">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-20 h-20 rounded-2xl border-2 border-amber-400 shadow-xl bg-slate-800 object-cover"
            />
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] shadow">
              Lv.{level}
            </div>
          </div>

          {/* User Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-400 text-sm font-bold text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 text-xs text-slate-400"
                  >
                    Huỷ
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    {user.displayName}
                  </h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[11px] text-amber-400 hover:underline font-medium"
                  >
                    Đổi tên
                  </button>
                </>
              )}
            </div>

            {/* ID & Copy */}
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
              <span className="font-mono text-[11px]">ID: {user.id}</span>
              <button
                onClick={handleCopyId}
                className="p-1 rounded hover:bg-slate-800 text-amber-400 transition-colors"
                title="Sao chép ID"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Logout Button if real user */}
              {!isGuest && (
                <button
                  onClick={() => { onClose(); onLogout && onLogout(); }}
                  className="ml-auto text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors pl-2 border-l border-slate-700"
                  title="Đăng xuất khỏi tài khoản"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Đăng Xuất</span>
                </button>
              )}
            </div>

            {/* Guest Upgrade Banner */}
            {isGuest && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between">
                <div className="text-[11px] text-amber-200">
                  ⚠️ <strong>Tài khoản Khách</strong>: Đăng ký tài khoản thật để lưu trữ Elo vĩnh viễn!
                </div>
                <button
                  onClick={() => { onClose(); onOpenAuth && onOpenAuth(); }}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-[11px] rounded-lg shadow shrink-0 ml-2"
                >
                  Đăng Ký Thật ➔
                </button>
              </div>
            )}

            {/* XP Level Progress Bar */}
            <div className="mt-2.5 max-w-xs">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>Tiến Trình Cấp {level}</span>
                <span className="text-amber-400">{xpCurrent} / 1000 XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex gap-2 my-4 border-b border-slate-800 pb-2 shrink-0">
          {[
            { id: 'overview', label: 'Tổng Quan & Chiến Tích', icon: Trophy },
            { id: 'ratings', label: 'Rating Từng Môn Cờ', icon: Award },
            { id: 'friends', label: `Bạn Bè (${friends.length})`, icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="overflow-y-auto space-y-4 pr-1">
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng Trận</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">{totalMatches}</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Thắng</div>
                <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">{stats.wins || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-center">
                <div className="text-[10px] font-bold text-red-400 uppercase">Thua</div>
                <div className="text-lg font-black text-red-300 font-mono mt-0.5">{stats.losses || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
                <div className="text-[10px] font-bold text-amber-400 uppercase">Tỷ Lệ Thắng</div>
                <div className="text-lg font-black text-amber-300 font-mono mt-0.5">{winRate}%</div>
              </div>
            </div>

            {/* Win Streak & Title */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Chuỗi Thắng Hiện Tại</div>
                  <div className="text-base font-black text-amber-300">{stats.streak || 0} trận liên tiếp</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Danh Hiệu</div>
                <div className="text-xs font-black text-emerald-400">
                  {level >= 20 ? '🌟 Đại Kiện Tướng' : level >= 10 ? '⚔️ Kỳ Thủ Ưu Tú' : '🌱 Tân Binh Đấu Trường'}
                </div>
              </div>
            </div>

            {/* Quick Change Avatar Picker */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Chọn Avatar Yêu Thích
              </label>
              <div className="flex gap-2">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt="avatar option"
                    onClick={() => handleChangeAvatar(av)}
                    className={`w-11 h-11 rounded-xl p-0.5 bg-slate-800 border-2 cursor-pointer hover:scale-105 transition-all ${
                      user.avatar === av ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ratings per Game */}
        {activeTab === 'ratings' && (
          <div className="overflow-y-auto space-y-2 pr-1 max-h-72">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GAME_NAMES).map(([gId, gName]) => {
                const elo = (user.ratings && user.ratings[gId]) || 1500;
                return (
                  <div
                    key={gId}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-white">{gName}</div>
                      <div className="text-[10px] text-slate-400">Đấu Xếp Hạng</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-sm sm:text-base text-amber-400">
                        {elo}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Friends & Play Together */}
        {activeTab === 'friends' && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Add Friend Form */}
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập ID hoặc Tên kỳ thủ để kết bạn..."
                value={friendQuery}
                onChange={e => setFriendQuery(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs shadow hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Bạn</span>
              </button>
            </form>

            {/* Friend Msg Toast */}
            {friendMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                friendMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200' : 'bg-red-950/80 border border-red-500 text-red-200'
              }`}>
                {friendMsg.text}
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Danh Sách Bạn Bè ({friends.length})
              </div>

              {friends.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-2xl border border-slate-800/60">
                  Chưa có bạn bè nào. Hãy kết bạn bằng ID để mời chơi chung!
                </div>
              ) : (
                friends.map(friend => (
                  <div
                    key={friend.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1">
                          {friend.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {friend.id} • Lv.{friend.stats?.level || 1}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onInviteFriend && onInviteFriend(friend);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mời Chơi</span>
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Xoá bạn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
