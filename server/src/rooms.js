import { GameRegistry } from '../../shared/games/index.js';
import { EloCalculator } from '../../shared/gameFramework/EloCalculator.js';
import { TimerManager } from '../../shared/gameFramework/TimerManager.js';
import { ReplayEngine } from '../../shared/gameFramework/ReplayEngine.js';
import { db } from './database.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> roomState
    this.seedDemoLiveRooms();
    this.startGlobalTimerLoop();
    this.startDemoSimulationLoop();
  }

  seedDemoLiveRooms() {
    // 1. Live Chess Match (Kiện Tướng)
    const chessRoom = this.createRoom({
      name: 'Tranh Hùng Đại Kiện Tướng - Bàn 1',
      gameId: 'chess',
      isPrivate: false,
      timerPreset: '10+0',
      hostUser: { id: 'player_top1', username: 'nguyena', displayName: 'Nguyễn Văn A (GM)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyena', ratings: { chess: 2250 } }
    });
    chessRoom.players.push({
      id: 'player_top2', username: 'tranb', displayName: 'Trần B (IM)',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tranb',
      rating: 2150, ready: true, colorIndex: 1
    });
    chessRoom.status = 'playing';
    chessRoom.isDemo = true;
    chessRoom.spectators.push(
      { id: 'spec_1', displayName: 'Kỳ Thủ Hải Phòng', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spec1' },
      { id: 'spec_2', displayName: 'Cờ Thủ Hà Nội', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spec2' }
    );
    chessRoom.timer.running = true;

    // 2. Live Co Ca Ngua 3D Match
    const horseRoom = this.createRoom({
      name: 'Đua Ngựa Vòng Bán Kết 3D 🏆',
      gameId: 'co_ca_ngua',
      isPrivate: false,
      timerPreset: '10+0',
      hostUser: { id: 'player_top3', username: 'nguyenc', displayName: 'Nguyễn C (Vua Ngựa)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyenc', ratings: { co_ca_ngua: 1750 } }
    });
    horseRoom.players.push({
      id: 'player_top4', username: 'lethid', displayName: 'Lê Thị D',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lethid',
      rating: 1680, ready: true, colorIndex: 1
    });
    horseRoom.status = 'playing';
    horseRoom.isDemo = true;
    horseRoom.spectators.push(
      { id: 'spec_3', displayName: 'Fan Cờ Cá Ngựa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spec3' }
    );
    horseRoom.timer.running = true;

    // 3. Live Xiangqi Match (Cờ Tướng)
    const xqRoom = this.createRoom({
      name: 'Kỳ Vương Tranh Cúp Vàng - Cờ Tướng',
      gameId: 'xiangqi',
      isPrivate: false,
      timerPreset: '15+10',
      hostUser: { id: 'player_top5', username: 'hoangviet', displayName: 'Hoàng Việt (Đặc Cấp)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hoangviet', ratings: { xiangqi: 2320 } }
    });
    xqRoom.players.push({
      id: 'player_top6', username: 'vuminh', displayName: 'Vũ Minh (Kiện Tướng)',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vuminh',
      rating: 2210, ready: true, colorIndex: 1
    });
    xqRoom.status = 'playing';
    xqRoom.isDemo = true;
    xqRoom.spectators.push(
      { id: 'spec_4', displayName: 'Hội Quán Cờ Tướng', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spec4' },
      { id: 'spec_5', displayName: 'Bình Luận Viên Cờ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spec5' }
    );
    xqRoom.timer.running = true;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom({ name, gameId, isPrivate, password, timerPreset = '10+0', isRanked = false, hostUser, options = {} }) {
    const game = GameRegistry.get(gameId);
    if (!game) throw new Error(`Game [${gameId}] không tồn tại trên hệ thống`);

    const roomCode = this.generateRoomCode();
    const cleanPassword = (typeof password === 'string' && password.trim().length > 0) ? password.trim() : null;
    
    // Parse timer
    let initialSecs = 600;
    let incSecs = 0;
    if (timerPreset === '3+2') { initialSecs = 180; incSecs = 2; }
    else if (timerPreset === '5+0') { initialSecs = 300; incSecs = 0; }
    else if (timerPreset === '10+0') { initialSecs = 600; incSecs = 0; }
    else if (timerPreset === '15+10') { initialSecs = 900; incSecs = 10; }
    else if (timerPreset === 'unlimited') { initialSecs = 86400; incSecs = 0; }

    const timer = TimerManager.createInitialClocks(initialSecs, incSecs, game.maxPlayers || 2);
    timer.clocks = timer.times;
    const initialGameState = game.init(options);

    const room = {
      code: roomCode,
      name: name || `Phòng ${roomCode}`,
      gameId,
      gameName: game.nameVi,
      isPrivate: !!isPrivate,
      password: cleanPassword,
      isRanked: !!isRanked,
      timerPreset,
      timer,
      hostId: hostUser.id,
      status: 'waiting', // 'waiting' | 'playing' | 'ended'
      players: [
        {
          id: hostUser.id,
          username: hostUser.username,
          displayName: hostUser.displayName,
          avatar: hostUser.avatar,
          rating: (hostUser.ratings && hostUser.ratings[gameId]) || 1500,
          ready: false,
          colorIndex: 0
        }
      ],
      spectators: [],
      gameState: initialGameState,
      replay: new ReplayEngine(gameId, {
        roomCode,
        gameName: game.nameVi,
        timeControl: timerPreset
      }),
      messages: [],
      rematchVotes: new Set(),
      drawOffer: null,
      voiceUsers: new Map(), // socketId -> { userId, muted, deafened, speaking }
      createdAt: Date.now()
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    const code = (roomCode || '').trim().toUpperCase();
    return this.rooms.get(code);
  }

  joinRoom(roomCode, user, socket, password = null, forceSpectate = false) {
    const code = (roomCode || '').trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) throw new Error('Phòng chơi không tồn tại hoặc đã giải tán');

    const cleanPassword = (typeof password === 'string' && password.trim().length > 0) ? password.trim() : null;
    if (room.password && room.password !== cleanPassword) {
      throw new Error('Mật khẩu phòng không đúng');
    }

    const game = GameRegistry.get(room.gameId);
    const existingPlayerIndex = room.players.findIndex(p => p.id === user.id);

    if (existingPlayerIndex !== -1 && !forceSpectate) {
      // If room is still waiting for 2nd player, and another tab/device connects with the same account (very common in testing!)
      if (room.status === 'waiting' && room.players.length < (game.maxPlayers || 2)) {
        const colorIndex = room.players.length;
        const playerObj = {
          id: `${user.id}_player${colorIndex + 1}`,
          username: user.username,
          displayName: `${user.displayName || 'Người chơi'} (Tab 2)`,
          avatar: user.avatar,
          rating: (user.ratings && user.ratings[room.gameId]) || 1500,
          ready: false,
          colorIndex,
          socketId: socket.id
        };
        room.players.push(playerObj);
        socket.join(code);

        this.broadcastSystemMessage(code, `${playerObj.displayName} đã tham gia phòng với vai trò Người chơi ${colorIndex + 1}.`);
        this.startGame(code);
        return { room: this.sanitizeRoom(room), role: 'player', playerIndex: colorIndex };
      }

      // Reconnecting player
      socket.join(code);
      return { room: this.sanitizeRoom(room), role: 'player', playerIndex: room.players[existingPlayerIndex].colorIndex };
    }

    // Check if seats are available and not force-spectating
    if (!forceSpectate && room.players.length < (game.maxPlayers || 2) && room.status === 'waiting') {
      const colorIndex = room.players.length;
      const playerObj = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        rating: (user.ratings && user.ratings[room.gameId]) || 1500,
        ready: false,
        colorIndex,
        socketId: socket.id
      };
      room.players.push(playerObj);
      socket.join(code);

      this.broadcastSystemMessage(code, `${user.displayName} đã tham gia phòng với vai trò Người chơi.`);

      // Auto start if room is full
      if (room.players.length === (game.maxPlayers || 2)) {
        this.startGame(code);
      } else {
        this.io.to(code).emit('room:updated', this.sanitizeRoom(room));
      }

      return { room: this.sanitizeRoom(room), role: 'player', playerIndex: colorIndex };
    }

    // Otherwise join as spectator
    const alreadySpec = room.spectators.some(s => s.id === user.id);
    if (!alreadySpec) {
      room.spectators.push({
        id: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        joinedAt: Date.now()
      });
    }
    socket.join(code);

    this.broadcastSystemMessage(code, `👁️ ${user.displayName} đã vào khán đài theo dõi trận đấu.`);
    this.io.to(code).emit('spectators:updated', {
      count: room.spectators.length,
      spectators: room.spectators
    });
    this.io.to(code).emit('room:updated', this.sanitizeRoom(room));
    return { room: this.sanitizeRoom(room), role: 'spectator', playerIndex: -1 };
  }

  leaveRoom(roomCode, userId) {
    const room = this.rooms.get(roomCode);
    if (!room || !userId) return;

    // Check if spectator
    const specIdx = room.spectators.findIndex(s => s.id === userId);
    if (specIdx !== -1) {
      room.spectators.splice(specIdx, 1);
      this.io.to(roomCode).emit('spectators:updated', {
        count: room.spectators.length,
        spectators: room.spectators
      });
      this.io.to(roomCode).emit('room:updated', this.sanitizeRoom(room));
      return;
    }

    // Check if player
    const playerIndex = room.players.findIndex(p => p.id === userId);
    if (playerIndex !== -1) {
      const leavingPlayer = room.players[playerIndex];
      const playerName = leavingPlayer?.displayName || 'Người chơi';

      // 1. If game is currently playing and not yet over -> Forfeit leaver and award victory to remaining player
      if (room.status === 'playing' && (!room.gameState || !room.gameState.gameOver)) {
        const winnerIndex = (playerIndex === 0) ? 1 : 0;
        const winnerPlayer = room.players[winnerIndex];
        const winnerName = winnerPlayer?.displayName || 'Người chơi còn lại';

        this.broadcastSystemMessage(
          roomCode,
          `🚪 ${playerName} đã rời khỏi bàn đấu! ${winnerName} giành chiến thắng!`
        );

        this.endGame(roomCode, winnerIndex, `${playerName} đã rời khỏi bàn đấu (Xử thua).`);
        // Remove leaver from room.players now that match has ended
        room.players.splice(playerIndex, 1);
        this.io.to(roomCode).emit('room:updated', this.sanitizeRoom(room));
      } else if (room.status === 'waiting') {
        // Room was waiting for players
        room.players.splice(playerIndex, 1);
        this.broadcastSystemMessage(roomCode, `👋 ${playerName} đã rời phòng chờ.`);
        this.io.to(roomCode).emit('room:updated', this.sanitizeRoom(room));
      } else if (room.status === 'ended') {
        // Player leaves after match ended
        room.players.splice(playerIndex, 1);
        this.io.to(roomCode).emit('room:updated', this.sanitizeRoom(room));
      }

      // Check if room is empty (both players left) -> Delete room immediately
      if (room.players.length === 0 && room.spectators.length === 0 && !room.isDemo) {
        this.rooms.delete(roomCode);
        this.io.emit('lobby:room_removed', roomCode);
      }
    }
  }

  handleResign(roomCode, userId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing' || (room.gameState && room.gameState.gameOver)) return;

    const playerIndex = room.players.findIndex(p => p.id === userId);
    if (playerIndex === -1) return;

    const winnerIndex = (playerIndex === 0) ? 1 : 0;
    const resignPlayer = room.players[playerIndex]?.displayName || 'Người chơi';
    const winnerPlayer = room.players[winnerIndex]?.displayName || 'Đối thủ';

    this.broadcastSystemMessage(roomCode, `🏳️ ${resignPlayer} đã xin hàng (Chịu thua). ${winnerPlayer} giành chiến thắng!`);
    this.endGame(roomCode, winnerIndex, `${resignPlayer} đã xin hàng (Chịu thua).`);
  }

  startDemoSimulationLoop() {
    setInterval(() => {
      this.rooms.forEach((room, roomCode) => {
        if (!room.isDemo || room.status !== 'playing') return;

        const game = GameRegistry.get(room.gameId);
        if (!game) return;

        // If game is over, restart after 8 seconds
        if (room.gameState.gameOver) {
          if (!room._gameOverSince) room._gameOverSince = Date.now();
          if (Date.now() - room._gameOverSince > 8000) {
            room._gameOverSince = null;
            room.gameState = game.init({});
            room.status = 'playing';
            room.timer = TimerManager.createInitialClocks(600, 0, room.players.length || 2);
            room.timer.running = true;
            this.broadcastSystemMessage(roomCode, '⚔️ Ván cờ mới của trận tâm điểm bắt đầu!');
            this.io.to(roomCode).emit('game:started', {
              gameState: room.gameState,
              timer: room.timer,
              status: room.status
            });
          }
          return;
        }

        const turn = room.gameState.turn;
        const currentP = room.players[turn];
        if (!currentP) return;

        try {
          const aiMove = game.getAIMove(room.gameState, turn, 'medium');
          if (aiMove) {
            this.handleMove(roomCode, aiMove, currentP.id);
          }
        } catch (e) {
          // Ignore intermittent move errors in demo simulation
        }
      });
    }, 3200);
  }

  getTimerSnapshot(timer) {
    if (!timer) return null;
    const now = Date.now();
    const elapsed = timer.running ? Math.floor((now - timer.lastTick) / 1000) : 0;
    const currentTimes = { ...timer.times };
    if (timer.running && currentTimes[timer.activePlayer] !== undefined) {
      currentTimes[timer.activePlayer] = Math.max(0, currentTimes[timer.activePlayer] - elapsed);
    }
    return {
      ...timer,
      times: currentTimes,
      clocks: currentTimes
    };
  }

  startGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status === 'playing') return;

    const game = GameRegistry.get(room.gameId);
    room.status = 'playing';
    room.timer.running = true;
    room.timer.lastTick = Date.now();
    room.timer.clocks = room.timer.times;
    room.gameState = game.init({});

    this.broadcastSystemMessage(roomCode, '⚔️ Trận đấu chính thức bắt đầu!');
    const sanitized = this.sanitizeRoom(room);
    this.io.to(roomCode).emit('game:started', {
      gameState: room.gameState,
      timer: this.getTimerSnapshot(room.timer),
      status: room.status,
      room: sanitized
    });
    this.io.to(roomCode).emit('room:updated', sanitized);
  }

  handleMove(roomCode, move, userId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing') {
      return { success: false, error: 'Phòng không trong trạng thái thi đấu' };
    }

    const playerIndex = room.players.findIndex(p => p.id === userId);
    if (playerIndex === -1) {
      return { success: false, error: 'Bạn không phải người chơi trong phòng' };
    }

    const game = GameRegistry.get(room.gameId);
    if (!game) return { success: false, error: 'Lỗi động cơ trò chơi' };

    // Validate and execute move
    const moveResult = game.makeMove(room.gameState, move, playerIndex);
    if (!moveResult.valid) {
      return { success: false, error: moveResult.error || 'Nước đi không hợp lệ' };
    }

    room.gameState = moveResult.nextState;

    // Record in replay
    const notation = game.formatMove(move, room.gameState);
    room.replay.recordMove(playerIndex, move, notation, room.gameState);

    // Switch clock turn
    const nextPlayerIndex = room.gameState.turn;
    TimerManager.switchTurn(room.timer, nextPlayerIndex);
    room.timer.clocks = room.timer.times;

    // Check game over
    if (moveResult.result && moveResult.result.over) {
      this.endGame(roomCode, moveResult.result.winner, moveResult.result.reason);
    } else {
      this.io.to(roomCode).emit('game:move_made', {
        move,
        notation,
        playerIndex,
        gameState: room.gameState,
        timer: this.getTimerSnapshot(room.timer)
      });
    }

    return { success: true };
  }

  endGame(roomCode, winnerIndex, reason) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status === 'ended') return;

    room.status = 'ended';
    room.timer.running = false;
    if (room.gameState) {
      room.gameState.gameOver = true;
      room.gameState.winner = winnerIndex;
    }

    let winnerId = null;
    let ratingDeltas = null;

    if (winnerIndex !== null && room.players[winnerIndex]) {
      winnerId = room.players[winnerIndex].id;
    }

    // Rating calculations if 2 players
    if (room.players.length >= 2) {
      const p1 = db.findUserById(room.players[0].id);
      const p2 = db.findUserById(room.players[1].id);

      if (p1 && p2 && !p1.isBot && !p2.isBot) {
        if (!p1.ratings) p1.ratings = {};
        if (!p1.stats) p1.stats = { wins: 0, losses: 0, draws: 0, streak: 0, xp: 0, level: 1 };
        if (!p2.ratings) p2.ratings = {};
        if (!p2.stats) p2.stats = { wins: 0, losses: 0, draws: 0, streak: 0, xp: 0, level: 1 };

        const r1 = (p1.ratings && p1.ratings[room.gameId]) || 1500;
        const r2 = (p2.ratings && p2.ratings[room.gameId]) || 1500;
        const score1 = winnerIndex === 0 ? 1 : (winnerIndex === 1 ? 0 : 0.5);

        const eloResult = EloCalculator.calculate(r1, r2, score1);
        p1.ratings[room.gameId] = eloResult.newRatingA;
        p2.ratings[room.gameId] = eloResult.newRatingB;

        // Update stats
        if (winnerIndex === 0) {
          p1.stats.wins++; p1.stats.streak++; p1.stats.xp += 100;
          p2.stats.losses++; p2.stats.streak = 0; p2.stats.xp += 25;
        } else if (winnerIndex === 1) {
          p2.stats.wins++; p2.stats.streak++; p2.stats.xp += 100;
          p1.stats.losses++; p1.stats.streak = 0; p1.stats.xp += 25;
        } else {
          p1.stats.draws++; p1.stats.xp += 50;
          p2.stats.draws++; p2.stats.xp += 50;
        }

        p1.stats.level = Math.max(1, Math.floor(p1.stats.xp / 1000) + 1);
        p2.stats.level = Math.max(1, Math.floor(p2.stats.xp / 1000) + 1);

        db.updateUser(p1.id, { ratings: p1.ratings, stats: p1.stats });
        db.updateUser(p2.id, { ratings: p2.ratings, stats: p2.stats });

        ratingDeltas = {
          [p1.id]: eloResult.deltaA,
          [p2.id]: eloResult.deltaB
        };
      }
    }

    // Save match to database
    db.saveMatch({
      roomCode,
      gameId: room.gameId,
      gameName: room.gameName,
      players: room.players,
      winnerId,
      reason,
      ratingDeltas,
      totalMoves: room.replay ? room.replay.history.length : 0,
      replayData: room.replay ? room.replay.exportJson() : null
    });

    this.broadcastSystemMessage(roomCode, `🏆 Kết thúc ván cờ: ${reason}`);
    this.io.to(roomCode).emit('game:ended', {
      winnerIndex,
      winnerId,
      reason,
      ratingDeltas,
      gameState: room.gameState
    });
  }

  broadcastSystemMessage(roomCode, text) {
    const msg = {
      id: `sys_${Date.now()}_${Math.random()}`,
      sender: 'HỆ THỐNG',
      isSystem: true,
      text,
      timestamp: Date.now()
    };
    const room = this.rooms.get(roomCode);
    if (room) {
      room.messages.push(msg);
      this.io.to(roomCode).emit('chat:message', msg);
    }
  }

  startGlobalTimerLoop() {
    let tickCount = 0;
    setInterval(() => {
      tickCount++;
      this.rooms.forEach((room, roomCode) => {
        if (room.status === 'playing' && room.timer && room.timer.running) {
          const timeout = TimerManager.checkTimeout(room.timer);
          if (timeout) {
            const timedOutPlayer = room.players[timeout.timedOutPlayer];
            const reason = `${timedOutPlayer ? timedOutPlayer.displayName : 'Người chơi'} đã hết thời gian thi đấu!`;
            this.endGame(roomCode, timeout.winner, reason);
          } else if (tickCount % 2 === 0) {
            // Periodic timer sync every 2 seconds to keep clocks in sync
            this.io.to(roomCode).emit('timer:sync', this.getTimerSnapshot(room.timer));
          }
        }
      });
    }, 1000);
  }

  sanitizeRoom(room) {
    const { password, ...safeRoom } = room;
    safeRoom.hasPassword = !!(typeof room.password === 'string' && room.password.trim().length > 0);
    return safeRoom;
  }
}
