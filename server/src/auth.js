import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'board-arena-super-secret-key-2026';

export class AuthService {
  static async register(username, password, displayName) {
    if (!username || username.length < 3) {
      throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự');
    }
    if (!password || password.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const existing = db.findUserByUsername(username);
    if (existing) {
      throw new Error('Tên đăng nhập này đã có người sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = db.createUser({
      username,
      passwordHash,
      displayName: displayName || username,
      isGuest: false
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  static async login(username, password) {
    const user = db.findUserByUsername(username);
    if (!user || !user.passwordHash) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  static createGuest(guestName) {
    const id = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const name = guestName || `Khách ${Math.floor(1000 + Math.random() * 9000)}`;
    const guestUser = db.createUser({
      id,
      username: id,
      displayName: name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
      isGuest: true
    });

    const token = this.generateToken(guestUser);
    return { user: this.sanitizeUser(guestUser), token };
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  static sanitizeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
