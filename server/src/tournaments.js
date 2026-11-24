import { GameRegistry } from '../../shared/games/index.js';

export class TournamentManager {
  constructor(roomManager, io) {
    this.roomManager = roomManager;
    this.io = io;
    this.tournaments = new Map();
    this.seedInitialTournaments();
  }

  seedInitialTournaments() {
    this.createTournament({
      title: 'Đại Chiến Cờ Vua Mùa Hè 2026',
      gameId: 'chess',
      maxPlayers: 8,
      creatorUser: { id: 'player_top1', displayName: 'Nguyễn Văn A', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyena', ratings: { chess: 2250 } }
    });
    this.createTournament({
      title: 'Đua Ngựa Tranh Cúp Vàng 3D',
      gameId: 'co_ca_ngua',
      maxPlayers: 4,
      creatorUser: { id: 'player_top2', displayName: 'Trần B', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tranb', ratings: { co_ca_ngua: 1600 } }
    });
    this.createTournament({
      title: 'Kỳ Vương Cờ Tướng Mở Rộng',
      gameId: 'xiangqi',
      maxPlayers: 8,
      creatorUser: { id: 'player_top3', displayName: 'Nguyễn C', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyenc', ratings: { xiangqi: 2100 } }
    });
  }

  createTournament({ title, gameId, maxPlayers = 8, creatorUser }) {
    const game = GameRegistry.get(gameId);
    if (!game) throw new Error('Game không tồn tại');

    const tournamentId = `tour_${Date.now()}`;
    const tournament = {
      id: tournamentId,
      title: title || `Giải Đấu ${game.nameVi}`,
      gameId,
      gameName: game.nameVi,
      maxPlayers, // 4, 8, or 16
      creator: creatorUser,
      status: 'registration', // 'registration' | 'in_progress' | 'completed'
      participants: [
        {
          id: creatorUser.id,
          displayName: creatorUser.displayName,
          avatar: creatorUser.avatar,
          rating: (creatorUser.ratings && creatorUser.ratings[gameId]) || 1500
        }
      ],
      bracket: [], // Rounds of matches
      champion: null,
      createdAt: Date.now()
    };

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  joinTournament(tournamentId, user) {
    const tour = this.tournaments.get(tournamentId);
    if (!tour) throw new Error('Giải đấu không tồn tại');
    if (tour.status !== 'registration') throw new Error('Giải đấu đã bắt đầu hoặc đã kết thúc');
    if (tour.participants.some(p => p.id === user.id)) return tour;
    if (tour.participants.length >= tour.maxPlayers) throw new Error('Giải đấu đã đủ số lượng tuyển thủ');

    tour.participants.push({
      id: user.id,
      displayName: user.displayName,
      avatar: user.avatar,
      rating: (user.ratings && user.ratings[tour.gameId]) || 1500
    });

    if (tour.participants.length === tour.maxPlayers) {
      this.startTournament(tournamentId);
    }

    return tour;
  }

  startTournament(tournamentId) {
    const tour = this.tournaments.get(tournamentId);
    if (!tour) return;

    tour.status = 'in_progress';
    // Generate Round 1 brackets
    const seeded = [...tour.participants].sort((a, b) => b.rating - a.rating);
    const round1 = [];

    for (let i = 0; i < seeded.length / 2; i++) {
      const p1 = seeded[i];
      const p2 = seeded[seeded.length - 1 - i];
      round1.push({
        matchId: `t_${tour.id}_r1_m${i}`,
        round: 1,
        player1: p1,
        player2: p2,
        winner: null,
        roomCode: null
      });
    }

    tour.bracket = [round1];
    this.io.emit('tournament:updated', tour);
  }

  getTournament(tournamentId) {
    return this.tournaments.get(tournamentId);
  }

  getAllTournaments() {
    return Array.from(this.tournaments.values());
  }
}
