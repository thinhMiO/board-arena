import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const dbFilePath = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default initial state
const defaultDb = {
  users: [
    {
      id: 'bot_easy',
      username: 'AI Tập Sự',
      displayName: 'AI Tập Sự (Dễ)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=easy',
      isBot: true,
      ratings: { chess: 1000, xiangqi: 1000, gomoku: 1000, go: 1000, checkers: 1000, reversi: 1000, connect_four: 1000, shogi: 1000, co_ganh: 1000, o_an_quan: 1000, co_ca_ngua: 1000, nine_mens_morris: 1000 },
      stats: { wins: 120, losses: 540, draws: 30, streak: 0, xp: 500, level: 2 }
    },
    {
      id: 'bot_master',
      username: 'Đại Kiện Tướng AI',
      displayName: 'Grandmaster AI',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=master',
      isBot: true,
      ratings: { chess: 2450, xiangqi: 2400, gomoku: 2500, go: 2350, checkers: 2200, reversi: 2300, connect_four: 2250, shogi: 2300, co_ganh: 2100, o_an_quan: 2150, co_ca_ngua: 2000, nine_mens_morris: 2200 },
      stats: { wins: 980, losses: 45, draws: 110, streak: 15, xp: 25000, level: 35 }
    },
    {
      id: 'player_top1',
      username: 'nguyena',
      displayName: 'Nguyễn Văn A',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyena',
      ratings: { chess: 2250, xiangqi: 1950, gomoku: 2100, go: 1800, checkers: 1700, reversi: 1650, connect_four: 1600, shogi: 1550, co_ganh: 1750, o_an_quan: 1900, co_ca_ngua: 1500, nine_mens_morris: 1650 },
      stats: { wins: 342, losses: 85, draws: 42, streak: 6, xp: 9500, level: 18 }
    },
    {
      id: 'player_top2',
      username: 'tranb',
      displayName: 'Trần B',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tranb',
      ratings: { chess: 2150, xiangqi: 2280, gomoku: 2050, go: 1920, checkers: 1600, reversi: 1700, connect_four: 1550, shogi: 1850, co_ganh: 1800, o_an_quan: 1850, co_ca_ngua: 1600, nine_mens_morris: 1580 },
      stats: { wins: 295, losses: 70, draws: 35, streak: 4, xp: 8200, level: 16 }
    },
    {
      id: 'player_top3',
      username: 'nguyenc',
      displayName: 'Nguyễn C',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyenc',
      ratings: { chess: 2080, xiangqi: 2100, gomoku: 2450, go: 2050, checkers: 1800, reversi: 1750, connect_four: 1700, shogi: 1700, co_ganh: 1900, o_an_quan: 2050, co_ca_ngua: 1700, nine_mens_morris: 1750 },
      stats: { wins: 410, losses: 110, draws: 50, streak: 8, xp: 12400, level: 22 }
    }
  ],
  matches: [],
  tournaments: []
};

class Database {
  constructor() {
    this.data = defaultDb;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Error loading database, using default:', err.message);
      this.data = defaultDb;
    }
  }

  save() {
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Error saving database:', err.message);
    }
  }

  // Users
  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  findUserByUsername(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(userData) {
    const newUser = {
      id: userData.id || `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: userData.username,
      passwordHash: userData.passwordHash,
      displayName: userData.displayName || userData.username,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      ratings: {
        chess: 1500, xiangqi: 1500, gomoku: 1500, go: 1500, checkers: 1500,
        reversi: 1500, connect_four: 1500, shogi: 1500, co_ganh: 1500,
        o_an_quan: 1500, co_ca_ngua: 1500, nine_mens_morris: 1500,
        ...(userData.ratings || {})
      },
      stats: {
        wins: 0, losses: 0, draws: 0, streak: 0, xp: 0, level: 1,
        ...(userData.stats || {})
      },
      friends: [],
      blockedUsers: [],
      achievements: ['Tân Thủ Đấu Trường'],
      isGuest: !!userData.isGuest,
      createdAt: Date.now()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.save();
      return this.data.users[index];
    }
    return null;
  }

  // Leaderboards - Based exclusively on registered real players who have played
  getLeaderboard(gameId = 'chess', limit = 20) {
    return this.data.users
      .filter(u => !u.isBot && !u.isGuest && !u.id.startsWith('guest_'))
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        rating: (u.ratings && u.ratings[gameId]) || 1500,
        stats: u.stats || { wins: 0, losses: 0, draws: 0, streak: 0, xp: 0, level: 1 },
        totalGames: ((u.stats?.wins || 0) + (u.stats?.losses || 0) + (u.stats?.draws || 0))
      }))
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.stats?.wins || 0) - (a.stats?.wins || 0);
      })
      .slice(0, limit);
  }

  getOverallLeaderboard(limit = 20) {
    return this.data.users
      .filter(u => !u.isBot && !u.isGuest && !u.id.startsWith('guest_'))
      .map(u => {
        const ratingVals = Object.values(u.ratings || {});
        const avgRating = ratingVals.length ? Math.round(ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length) : 1500;
        return {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatar: u.avatar,
          avgRating,
          stats: u.stats || { wins: 0, losses: 0, draws: 0, streak: 0, xp: 0, level: 1 },
          totalGames: ((u.stats?.wins || 0) + (u.stats?.losses || 0) + (u.stats?.draws || 0))
        };
      })
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return (b.stats?.wins || 0) - (a.stats?.wins || 0);
      })
      .slice(0, limit);
  }

  // Matches
  saveMatch(matchRecord) {
    this.data.matches.unshift({
      id: `m_${Date.now()}`,
      timestamp: Date.now(),
      ...matchRecord
    });
    // Keep max 500 matches in local store
    if (this.data.matches.length > 500) {
      this.data.matches = this.data.matches.slice(0, 500);
    }
    this.save();
  }

  getMatchHistory(userId, limit = 20) {
    return this.data.matches
      .filter(m => m.players.some(p => p.id === userId))
      .slice(0, limit);
  }

  getMatchById(id) {
    return this.data.matches.find(m => m.id === id);
  }

  // Friends & Profile
  getFriends(userId) {
    const user = this.findUserById(userId);
    if (!user) return [];
    const friendIds = user.friends || [];
    return this.data.users
      .filter(u => friendIds.includes(u.id))
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        status: 'online',
        stats: u.stats,
        ratings: u.ratings
      }));
  }

  addFriend(userId, friendQuery) {
    const user = this.findUserById(userId);
    if (!user) throw new Error('Không tìm thấy người dùng');
    if (!user.friends) user.friends = [];

    const query = (friendQuery || '').toLowerCase().trim();
    const target = this.data.users.find(u =>
      (u.id === friendQuery || u.username.toLowerCase() === query || u.displayName.toLowerCase() === query) &&
      u.id !== userId
    );

    if (!target) throw new Error('Không tìm thấy kỳ thủ với ID hoặc tên này');
    if (user.friends.includes(target.id)) throw new Error('Đã kết bạn với người này rồi');

    user.friends.push(target.id);
    if (!target.friends) target.friends = [];
    if (!target.friends.includes(userId)) target.friends.push(userId);

    this.save();
    return {
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      avatar: target.avatar,
      status: 'online',
      stats: target.stats,
      ratings: target.ratings
    };
  }

  removeFriend(userId, friendId) {
    const user = this.findUserById(userId);
    if (user && user.friends) {
      user.friends = user.friends.filter(id => id !== friendId);
      this.save();
    }
    const friend = this.findUserById(friendId);
    if (friend && friend.friends) {
      friend.friends = friend.friends.filter(id => id !== userId);
      this.save();
    }
    return true;
  }
}

export const db = new Database();
