export class MatchmakingQueue {
  constructor(roomManager, io) {
    this.roomManager = roomManager;
    this.io = io;
    this.queue = []; // Array of { socketId, user, gameId, timeControl, enqueuedAt }
    this.startMatcher();
  }

  enqueue(socketId, user, gameId, timeControl = '10+0') {
    // Remove if already in queue
    this.dequeue(socketId);
    this.queue.push({
      socketId,
      user,
      gameId,
      timeControl,
      rating: (user.ratings && user.ratings[gameId]) || 1500,
      enqueuedAt: Date.now()
    });
    console.log(`[Matchmaking] Enqueued player ${user.displayName} for ${gameId}. Queue size: ${this.queue.length}`);
  }

  dequeue(socketId) {
    this.queue = this.queue.filter(q => q.socketId !== socketId);
  }

  startMatcher() {
    setInterval(() => {
      this.processQueue();
    }, 2000);
  }

  processQueue() {
    if (this.queue.length < 2) return;

    // Group by gameId
    const byGame = {};
    for (const item of this.queue) {
      if (!byGame[item.gameId]) byGame[item.gameId] = [];
      byGame[item.gameId].push(item);
    }

    for (const [gameId, players] of Object.entries(byGame)) {
      if (players.length >= 2) {
        // Sort by wait time
        players.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
        const p1 = players[0];

        // Find best rating match
        let bestCandidate = null;
        let minRatingDiff = Infinity;
        const waitSecs = (Date.now() - p1.enqueuedAt) / 1000;
        const maxAllowedDelta = Math.min(600, 100 + waitSecs * 25); // Expands over time

        for (let i = 1; i < players.length; i++) {
          const p2 = players[i];
          const diff = Math.abs(p1.rating - p2.rating);
          if (diff <= maxAllowedDelta && diff < minRatingDiff) {
            minRatingDiff = diff;
            bestCandidate = p2;
          }
        }

        if (bestCandidate) {
          // Remove both from queue
          this.dequeue(p1.socketId);
          this.dequeue(bestCandidate.socketId);

          // Create ranked room
          const room = this.roomManager.createRoom({
            name: `Ranked Match: ${p1.user.displayName} vs ${bestCandidate.user.displayName}`,
            gameId,
            isPrivate: false,
            isRanked: true,
            timerPreset: p1.timeControl || '10+0',
            hostUser: p1.user
          });

          // Inform both sockets
          this.io.to(p1.socketId).emit('matchmaking:matched', {
            roomCode: room.code,
            opponent: {
              displayName: bestCandidate.user.displayName,
              avatar: bestCandidate.user.avatar,
              rating: bestCandidate.rating
            }
          });

          this.io.to(bestCandidate.socketId).emit('matchmaking:matched', {
            roomCode: room.code,
            opponent: {
              displayName: p1.user.displayName,
              avatar: p1.user.avatar,
              rating: p1.rating
            }
          });

          console.log(`[Matchmaking] Successfully matched ${p1.user.displayName} vs ${bestCandidate.user.displayName} in room ${room.code}`);
        }
      }
    }
  }
}
