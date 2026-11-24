import React, { useState, useEffect } from 'react';
import { X, Bot, Monitor, Globe, Shuffle, Clock, Lock, ShieldCheck, Play, LogIn, KeyRound, Eye, Share2 } from 'lucide-react';
import { GAME_COVERS } from './GameCard';

export const PlayModal = ({ game, isOpen, onClose, onStartMatch, defaultTab = 'ai' }) => {
  if (!isOpen || !game) return null;

  const [activeTab, setActiveTab] = useState(defaultTab); // 'ai' | 'pass_play' | 'create_room' | 'join_room' | 'matchmaking'
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [timeControl, setTimeControl] = useState('10+0');
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleStartAI = () => {
    onStartMatch({
      mode: 'ai',
      gameId: game.id,
      difficulty: aiDifficulty,
      timeControl
    });
    onClose();
  };

  const handleStartPassAndPlay = () => {
    onStartMatch({
      mode: 'pass_play',
      gameId: game.id,
      timeControl
    });
    onClose();
  };

  const handleCreateRoom = () => {
    onStartMatch({
      mode: 'create_room',
      gameId: game.id,
      roomName: roomName || `Phòng ${game.nameVi}`,
      password: roomPassword || null,
      isPrivate,
      timeControl
    });
    onClose();
  };

  const handleJoinRoom = () => {
    if (!joinRoomCode.trim()) {
      alert('Vui lòng nhập mã phòng!');
      return;
    }
    onStartMatch({
      mode: 'join_room',
      gameId: game.id,
      roomCode: joinRoomCode.trim().toUpperCase(),
      password: joinPassword || null
    });
    onClose();
  };

  const handleSpectateRoom = () => {
    if (!joinRoomCode.trim()) {
      alert('Vui lòng nhập mã phòng!');
      return;
    }
    onStartMatch({
      mode: 'spectate',
      gameId: game.id,
      roomCode: joinRoomCode.trim().toUpperCase(),
      password: joinPassword || null
    });
    onClose();
  };

  const handleStartMatchmaking = () => {
    onStartMatch({
      mode: 'matchmaking',
      gameId: game.id,
      timeControl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-slate-700/80 p-6 shadow-2xl overflow-hidden bg-slate-900/95">
        {/* Modal Banner with Game Artwork */}
        <div className="relative -mx-6 -mt-6 h-32 overflow-hidden mb-5">
          <img
            src={game.coverImage || GAME_COVERS[game.id] || GAME_COVERS.chess}
            alt={game.nameVi}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-black/40" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-6">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-black/60 border border-amber-400/20">
              {game.category === 'vietnamese' ? 'Dân Gian Việt Nam' : 'Chiến Thuật'}
            </span>
            <h2 className="text-2xl font-extrabold text-white font-serif mt-1 drop-shadow">
              {game.nameVi}
            </h2>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-5 gap-1.5 mb-6 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'ai'
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Với AI</span>
          </button>
          <button
            onClick={() => setActiveTab('pass_play')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'pass_play'
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>2 Người</span>
          </button>
          <button
            onClick={() => setActiveTab('matchmaking')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'matchmaking'
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Ghép Đấu</span>
          </button>
          <button
            onClick={() => setActiveTab('create_room')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'create_room'
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Tạo Phòng</span>
          </button>
          <button
            onClick={() => setActiveTab('join_room')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'join_room'
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Vào Phòng</span>
          </button>
        </div>

        {/* Time Control Presets */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Thời Gian Ván Đấu
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: '3+2', label: '3+2 Blitz' },
              { id: '5+0', label: '5 phút' },
              { id: '10+0', label: '10 phút' },
              { id: 'unlimited', label: 'Vô hạn' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTimeControl(t.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  timeControl === t.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Specific Content */}
        {activeTab === 'ai' && (
          <div className="mb-6 space-y-4">
            <label className="text-xs font-bold text-slate-300 block">
              Độ Khó Của Máy (AI Engine)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'easy', label: 'Dễ', desc: '1000' },
                { id: 'medium', label: 'Trung Bình', desc: '1500' },
                { id: 'hard', label: 'Khó', desc: '1900' },
                { id: 'master', label: 'Cao Thủ', desc: '2400+' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setAiDifficulty(d.id)}
                  className={`py-3 px-2 rounded-xl text-center border transition-all ${
                    aiDifficulty === d.id
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Elo {d.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={handleStartAI}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Bắt Đầu Đấu Với Máy</span>
            </button>
          </div>
        )}

        {activeTab === 'pass_play' && (
          <div className="mb-6 space-y-4">
            <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
              Hai người luân phiên đi cờ trên cùng một máy tính, tablet hoặc điện thoại thoại. Thích hợp chơi giải trí trực tiếp cùng bạn bè.
            </p>
            <button
              onClick={handleStartPassAndPlay}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Bắt Đầu Ván Đấu Offline</span>
            </button>
          </div>
        )}

        {activeTab === 'matchmaking' && (
          <div className="mb-6 space-y-4">
            <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
              Hệ thống tự động tìm đối thủ có mức Rating tương đương trong chế độ Đấu Xếp Hạng.
            </p>
            <button
              onClick={handleStartMatchmaking}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 animate-pulse"
            >
              <Shuffle className="w-5 h-5" />
              <span>Tìm Đối Thủ Ngẫu Nhiên</span>
            </button>
          </div>
        )}

        {activeTab === 'create_room' && (
          <div className="mb-6 space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
              <Share2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Chơi cùng bạn bè:</strong> Sau khi bấm tạo phòng, hệ thống sẽ cấp ngay <strong>Mã Phòng 6 ký tự</strong> và <strong>Link Mời</strong> để bạn gửi cho bạn bè qua Zalo, Messenger, Telegram... vào chơi hoặc xem trực tiếp!
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tên Bàn Chơi
              </label>
              <input
                type="text"
                placeholder={`Bàn ${game.nameVi} của tôi`}
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Mật Khẩu Phòng (Tùy chọn)
              </label>
              <input
                type="password"
                placeholder="Để trống nếu muốn phòng công khai"
                value={roomPassword}
                onChange={e => setRoomPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Globe className="w-5 h-5" />
              <span>Tạo Phòng & Lấy Mã Mời Bạn Bè</span>
            </button>
          </div>
        )}

        {activeTab === 'join_room' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Mã Phòng (6 ký tự do bạn bè gửi)
              </label>
              <input
                type="text"
                placeholder="VD: A1B2C3"
                value={joinRoomCode}
                onChange={e => setJoinRoomCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xl font-mono font-black text-amber-400 tracking-widest text-center focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Mật Khẩu Phòng (Nếu có)
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu nếu phòng yêu cầu"
                value={joinPassword}
                onChange={e => setJoinPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleJoinRoom}
                className="py-3 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Chơi Cùng Bạn</span>
              </button>
              <button
                onClick={handleSpectateRoom}
                className="py-3 px-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>Khán Đài (Xem)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
