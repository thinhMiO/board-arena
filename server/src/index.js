import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './database.js';
import { AuthService } from './auth.js';
import { RoomManager } from './rooms.js';
import { MatchmakingQueue } from './matchmaking.js';
import { TournamentManager } from './tournaments.js';
import { GameRegistry } from '../../shared/games/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend build if present (for single-container free deploy on Render/Railway)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);
const matchmaking = new MatchmakingQueue(roomManager, io);
const tournaments = new TournamentManager(roomManager, io);

// ==================== REST API ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Board Arena API', time: new Date().toISOString() });
});

// Games list
app.get('/api/games', (req, res) => {
  res.json(GameRegistry.getMetadataList());
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    const result = await AuthService.register(username, password, displayName);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/guest', (req, res) => {
  try {
    const { displayName } = req.body;
    const result = AuthService.createGuest(displayName);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  const decoded = AuthService.verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Token không hợp lệ' });
  const user = db.findUserById(decoded.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  res.json(AuthService.sanitizeUser(user));
});

// Profile update
app.put('/api/users/:userId/profile', (req, res) => {
  try {
    const { displayName, avatar } = req.body;
    const updated = db.updateUser(req.params.userId, {
      ...(displayName ? { displayName: displayName.trim() } : {}),
      ...(avatar ? { avatar } : {})
    });
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    res.json(AuthService.sanitizeUser(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Friends list
app.get('/api/users/:userId/friends', (req, res) => {
  try {
    const friends = db.getFriends(req.params.userId);
    res.json(friends);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/:userId/friends', (req, res) => {
  try {
    const { query } = req.body;
    const friend = db.addFriend(req.params.userId, query);
    res.json({ success: true, friend });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:userId/friends/:friendId', (req, res) => {
  try {
    db.removeFriend(req.params.userId, req.params.friendId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Leaderboards
app.get('/api/leaderboards', (req, res) => {
  const gameId = req.query.gameId;
  if (gameId && gameId !== 'overall') {
    res.json(db.getLeaderboard(gameId, 20));
  } else {
    res.json(db.getOverallLeaderboard(20));
  }
});

// Matches history
app.get('/api/matches/user/:userId', (req, res) => {
  res.json(db.getMatchHistory(req.params.userId));
});

app.post('/api/matches/record', (req, res) => {
  try {
    const { userId, gameId, result, opponentName, reason } = req.body;
    const user = db.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    if (!user.ratings) user.ratings = {};
    if (!user.stats) user.stats = { wins: 0, losses: 0, draws: 0, streak: 0, xp: 0, level: 1 };

    const currentRating = user.ratings[gameId] || 1500;
    let delta = 0;

    if (result === 'win') {
      delta = 16;
      user.stats.wins++;
      user.stats.streak++;
      user.stats.xp += 100;
    } else if (result === 'loss') {
      delta = -12;
      user.stats.losses++;
      user.stats.streak = 0;
      user.stats.xp += 25;
    } else {
      delta = 0;
      user.stats.draws++;
      user.stats.xp += 50;
    }

    user.ratings[gameId] = Math.max(800, currentRating + delta);
    user.stats.level = Math.max(1, Math.floor(user.stats.xp / 1000) + 1);

    db.updateUser(userId, { ratings: user.ratings, stats: user.stats });

    db.saveMatch({
      gameId,
      players: [
        { id: user.id, displayName: user.displayName, rating: user.ratings[gameId] },
        { id: 'opponent', displayName: opponentName || 'Đối thủ', rating: 1500 }
      ],
      winnerId: result === 'win' ? user.id : (result === 'loss' ? 'opponent' : null),
      reason: reason || (result === 'win' ? 'Chiến thắng' : 'Thất bại'),
      ratingDelta: delta
    });

    res.json({
      success: true,
      user: AuthService.sanitizeUser(user),
      delta,
      newRating: user.ratings[gameId]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/matches/:matchId', (req, res) => {
  const match = db.getMatchById(req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Không tìm thấy trận đấu' });
  res.json(match);
});

// Rooms list
app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(roomManager.rooms.values())
    .filter(r => !r.isPrivate)
    .map(r => roomManager.sanitizeRoom(r));
  res.json(publicRooms);
});

// Tournaments
app.get('/api/tournaments', (req, res) => {
  res.json(tournaments.getAllTournaments());
});

app.post('/api/tournaments', (req, res) => {
  try {
    const { title, gameId, maxPlayers, user } = req.body;
    const tour = tournaments.createTournament({ title, gameId, maxPlayers: Number(maxPlayers) || 8, creatorUser: user });
    res.json(tour);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tournaments/:id/join', (req, res) => {
  try {
    const { user } = req.body;
    const tour = tournaments.joinTournament(req.params.id, user);
    res.json(tour);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fallback to React index.html for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) res.send('BOARD ARENA Backend API Server is running. Client build will appear when built.');
  });
});

// ==================== REALTIME SOCKET.IO ====================

io.on('connection', socket => {
  let currentUser = null;
  let currentRoomCode = null;

  socket.on('auth:init', user => {
    currentUser = user;
    socket.emit('auth:ready', { status: 'connected', user });
  });

  // Room creation
  socket.on('room:create', (payload, callback) => {
    try {
      if (!currentUser && payload.user) {
        currentUser = payload.user;
      }
      const room = roomManager.createRoom({
        ...payload,
        hostUser: currentUser || payload.user
      });
      currentRoomCode = room.code;
      socket.join(room.code);
      if (typeof callback === 'function') callback({ success: true, room: roomManager.sanitizeRoom(room) });
      io.emit('lobby:room_created', roomManager.sanitizeRoom(room));
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Room joining (support role: 'spectator' for direct spectating)
  socket.on('room:join', ({ roomCode, password, user, role }, callback) => {
    try {
      const playerUser = currentUser || user;
      if (!currentUser && playerUser) {
        currentUser = playerUser;
      }
      const forceSpectate = role === 'spectator';
      const { room, role: actualRole, playerIndex } = roomManager.joinRoom(roomCode, playerUser, socket, password, forceSpectate);
      currentRoomCode = roomCode;
      if (typeof callback === 'function') {
        callback({ success: true, room: roomManager.sanitizeRoom(room), role: actualRole, playerIndex });
      }
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Leave room / Leave spectator
  socket.on('room:leave', ({ roomCode, userId }) => {
    const targetRoom = roomCode || currentRoomCode;
    const uid = userId || currentUser?.id;
    if (targetRoom) {
      roomManager.leaveRoom(targetRoom, uid);
      socket.leave(targetRoom);
      if (currentRoomCode === targetRoom) currentRoomCode = null;
    }
  });

  // Resign / Xin thua
  socket.on('game:resign', ({ roomCode }) => {
    const targetRoom = roomCode || currentRoomCode;
    if (targetRoom) {
      roomManager.handleResign(targetRoom, currentUser?.id);
    }
  });

  // Moves
  socket.on('game:move', ({ roomCode, move }, callback) => {
    const result = roomManager.handleMove(roomCode, move, currentUser?.id);
    if (typeof callback === 'function') callback(result);
  });

  // Matchmaking
  socket.on('matchmaking:find', ({ gameId, timeControl, user }) => {
    matchmaking.enqueue(socket.id, user || currentUser, gameId, timeControl);
    socket.emit('matchmaking:searching', { gameId, timeControl });
  });

  socket.on('matchmaking:cancel', () => {
    matchmaking.dequeue(socket.id);
    socket.emit('matchmaking:cancelled');
  });

  // Chat
  socket.on('chat:send', ({ roomCode, text, type = 'text', sticker = null }) => {
    const msg = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: currentUser?.id,
      sender: currentUser?.displayName || 'Ẩn danh',
      avatar: currentUser?.avatar,
      type,
      text,
      sticker,
      timestamp: Date.now()
    };
    const room = roomManager.getRoom(roomCode);
    if (room) {
      room.messages.push(msg);
      io.to(roomCode).emit('chat:message', msg);
    }
  });

  // Voice Chat Signaling (WebRTC)
  socket.on('voice:join', ({ roomCode, user }) => {
    socket.join(`voice_${roomCode}`);
    const room = roomManager.getRoom(roomCode);
    if (room) {
      room.voiceUsers.set(socket.id, {
        userId: user?.id || socket.id,
        displayName: user?.displayName || 'User',
        avatar: user?.avatar,
        muted: false,
        speaking: false
      });
      // Notify other voice peers in room to initiate WebRTC offers
      socket.to(`voice_${roomCode}`).emit('voice:peer_joined', {
        peerId: socket.id,
        user
      });
      // Send current voice room members to the newcomer
      const peers = Array.from(room.voiceUsers.entries()).map(([peerId, data]) => ({ peerId, ...data }));
      socket.emit('voice:roster', peers);
    }
  });

  socket.on('voice:offer', ({ toPeerId, offer }) => {
    io.to(toPeerId).emit('voice:offer', {
      fromPeerId: socket.id,
      offer
    });
  });

  socket.on('voice:answer', ({ toPeerId, answer }) => {
    io.to(toPeerId).emit('voice:answer', {
      fromPeerId: socket.id,
      answer
    });
  });

  socket.on('voice:ice-candidate', ({ toPeerId, candidate }) => {
    io.to(toPeerId).emit('voice:ice-candidate', {
      fromPeerId: socket.id,
      candidate
    });
  });

  socket.on('voice:state_change', ({ roomCode, muted, speaking }) => {
    const room = roomManager.getRoom(roomCode);
    if (room && room.voiceUsers.has(socket.id)) {
      const v = room.voiceUsers.get(socket.id);
      if (muted !== undefined) v.muted = muted;
      if (speaking !== undefined) v.speaking = speaking;
      io.to(`voice_${roomCode}`).emit('voice:user_state', {
        peerId: socket.id,
        muted: v.muted,
        speaking: v.speaking
      });
    }
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    matchmaking.dequeue(socket.id);
    if (currentRoomCode) {
      roomManager.leaveRoom(currentRoomCode, currentUser?.id);
      const room = roomManager.getRoom(currentRoomCode);
      if (room && room.voiceUsers.has(socket.id)) {
        room.voiceUsers.delete(socket.id);
        io.to(`voice_${currentRoomCode}`).emit('voice:peer_left', { peerId: socket.id });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` BOARD ARENA Backend Server running on port ${PORT}`);
  console.log(` WebSockets & WebRTC Signaling active`);
  console.log(` REST API available at http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
