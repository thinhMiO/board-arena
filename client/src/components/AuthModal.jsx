import React, { useState } from 'react';
import { X, User, Lock, Sparkles, LogIn, UserPlus, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { sound } from '../services/audio';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  if (!isOpen) return null;

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Client-side validations
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (isRegister) {
      if (!displayName.trim()) {
        setError('Vui lòng nhập tên hiển thị kỳ thủ');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không trùng khớp');
        return;
      }
    }

    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { username: cleanUser, password, displayName: displayName.trim() }
      : { username: cleanUser, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại');

      sound.playVictory();
      setSuccessMsg(isRegister ? 'Đăng ký tài khoản thật thành công! Đang đăng nhập...' : 'Đăng nhập thành công!');
      
      setTimeout(() => {
        onAuthSuccess(data);
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message);
      sound.playClick();
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: '' })
      });
      const data = await res.json();
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass-panel border border-slate-700/80 p-6 sm:p-8 shadow-2xl bg-slate-900/95 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Tài Khoản BOARD ARENA
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
            {isRegister ? 'Tạo Tài Khoản Thật' : 'Đăng Nhập Tài Khoản'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            {isRegister
              ? 'Lưu giữ vĩnh viễn bảng xếp hạng Elo, lịch sử đối đầu và kết bạn cùng cộng đồng kỳ thủ.'
              : 'Đăng nhập để tiếp tục chuỗi thắng và thi đấu xếp hạng.'}
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 gap-1 mb-5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isRegister
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isRegister
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng Ký Mới</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* The Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Display Name (Only on Register) */}
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tên Hiển Thị (Display Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VD: Kỳ Thủ Sài Gòn, Tuấn Kiệt..."
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Tên Đăng Nhập (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="VD: tuankiet99, nguyenvana..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Mật Khẩu (Ít nhất 6 ký tự)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Only on Register) */}
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Xác Nhận Mật Khẩu
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu..."
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black rounded-xl shadow-xl transition-all text-sm mt-3 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Hoàn Tất Đăng Ký Tài Khoản</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </>
            )}
          </button>
        </form>

        {/* Guest Alternative Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Hoặc Chơi Tự Do
          </span>
        </div>

        {/* Guest Button */}
        <button
          onClick={handleGuestPlay}
          disabled={loading}
          className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Vào Chơi Nhanh Với Tư Cách Khách (Guest)</span>
        </button>
      </div>
    </div>
  );
};
