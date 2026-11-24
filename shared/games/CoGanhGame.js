import { BaseGame } from '../gameFramework/BaseGame.js';

export class CoGanhGame extends BaseGame {
  constructor() {
    super({
      id: 'co_ganh',
      name: 'Co Ganh',
      nameVi: 'Cờ Gánh',
      category: 'vietnamese',
      description: 'Trò chơi cờ dân gian truyền thống độc đáo của Việt Nam với cơ chế Gánh và Vây đổi màu quân cờ.',
      rulesSummary: 'Bàn 5x5 có các đường chéo. Mỗi bên 8 quân. Di chuyển 1 bước dọc theo đường nối. Nước đi "Gánh": đi vào giữa 2 quân đối phương để biến cả 2 thành quân của mình! Nước đi "Vây": bao vây toàn bộ quân đối phương không còn đường đi để chiếm trọn.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Layers',
      coverGradient: 'from-emerald-800 to-green-950',
      variants: [{ id: 'standard', name: 'Cờ gánh truyền thống (5x5)' }],
      defaultSettings: {}
    });
  }

  init() {
    // 0: Blue (bottom, 8 pieces), 1: Red (top, 8 pieces)
    const board = Array(5).fill(null).map(() => Array(5).fill(null));

    // Red pieces at top (row 0: 5 pieces, row 1: cols 0, 4, row 2: col 2)
    board[0] = [1, 1, 1, 1, 1];
    board[1][0] = 1;
    board[1][4] = 1;
    board[2][2] = null; // center start empty
    board[1][2] = 1;

    // Blue pieces at bottom
    board[4] = [0, 0, 0, 0, 0];
    board[3][0] = 0;
    board[3][4] = 0;
    board[3][2] = 0;

    return {
      board,
      turn: 0, // Blue goes first
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  // Valid lines connecting intersections on 5x5 Cờ Gánh board
  _areConnected(r1, c1, r2, c2) {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);

    // Adjacent orthogonal is always connected
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) return true;

    // Diagonals exist only when (r + c) is even!
    if (dr === 1 && dc === 1 && (r1 + c1) % 2 === 0 && (r2 + c2) % 2 === 0) {
      return true;
    }

    return false;
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const moves = [];

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (state.board[r][c] === playerIndex) {
          // Check neighbors
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
                if (state.board[nr][nc] === null && this._areConnected(r, c, nr, nc)) {
                  moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                }
              }
            }
          }
        }
      }
    }

    return moves;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const validMoves = this.getValidMoves(state, playerIndex);
    const isValid = validMoves.some(m =>
      m.from.r === move.from.r && m.from.c === move.from.c &&
      m.to.r === move.to.r && m.to.c === move.to.c
    );

    if (!isValid) return { nextState: state, valid: false, error: 'Nước đi không hợp lệ' };

    const nextState = this.cloneState(state);
    nextState.board[move.from.r][move.from.c] = null;
    nextState.board[move.to.r][move.to.c] = playerIndex;

    const opp = 1 - playerIndex;
    const r = move.to.r;
    const c = move.to.c;

    // 1. Mechanism: "Gánh" (Sandwiching 2 opponents opposite across destination)
    const directions = [
      [ [0, -1], [0, 1] ],   // Ngang
      [ [-1, 0], [1, 0] ],   // Dọc
      [ [-1, -1], [1, 1] ],  // Chéo 1
      [ [-1, 1], [1, -1] ]   // Chéo 2
    ];

    for (const [d1, d2] of directions) {
      const r1 = r + d1[0], c1 = c + d1[1];
      const r2 = r + d2[0], c2 = c + d2[1];

      if (r1 >= 0 && r1 < 5 && c1 >= 0 && c1 < 5 && r2 >= 0 && r2 < 5 && c2 >= 0 && c2 < 5) {
        if (this._areConnected(r, c, r1, c1) && this._areConnected(r, c, r2, c2)) {
          if (nextState.board[r1][c1] === opp && nextState.board[r2][c2] === opp) {
            // "Gánh" succeeds! Convert both opponent pieces to my color
            nextState.board[r1][c1] = playerIndex;
            nextState.board[r2][c2] = playerIndex;
          }
        }
      }
    }

    // 2. Mechanism: "Vây" / "Chẹt" (Capture surrounded enemy groups with no liberties)
    this._captureSurroundedGroups(nextState.board, opp, playerIndex);

    nextState.lastMove = move;
    nextState.turn = opp;

    // Check game over (count remaining pieces and valid moves)
    let myCount = 0, oppCount = 0;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (nextState.board[i][j] === playerIndex) myCount++;
        if (nextState.board[i][j] === opp) oppCount++;
      }
    }

    const oppMoves = this.getValidMoves(nextState, opp);
    if (oppCount === 0 || oppMoves.length === 0) {
      nextState.gameOver = true;
      nextState.winner = playerIndex;
      return {
        nextState,
        valid: true,
        result: {
          over: true,
          winner: playerIndex,
          reason: `Chiến thắng rực rỡ! Đối thủ ${opp === 0 ? 'Xanh' : 'Đỏ'} đã hết quân hoặc hết đường đi!`
        }
      };
    }

    return { nextState, valid: true };
  }

  _captureSurroundedGroups(board, opp, playerIndex) {
    const visited = Array(5).fill(false).map(() => Array(5).fill(false));

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (board[r][c] === opp && !visited[r][c]) {
          const group = [];
          let hasLiberty = false;
          const queue = [{ r, c }];
          visited[r][c] = true;

          while (queue.length > 0) {
            const curr = queue.shift();
            group.push(curr);

            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = curr.r + dr, nc = curr.c + dc;
                if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && this._areConnected(curr.r, curr.c, nr, nc)) {
                  if (board[nr][nc] === null) {
                    hasLiberty = true;
                  } else if (board[nr][nc] === opp && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    queue.push({ r: nr, c: nc });
                  }
                }
              }
            }
          }

          if (!hasLiberty) {
            // Group is completely surrounded! Convert all to playerIndex
            group.forEach(pt => {
              board[pt.r][pt.c] = playerIndex;
            });
          }
        }
      }
    }
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Prioritize moves that execute "Gánh"
    for (const m of validMoves) {
      const sim = this.makeMove(state, m, playerIndex);
      if (sim.valid) {
        let countAfter = 0;
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (sim.nextState.board[r][c] === playerIndex) countAfter++;
          }
        }
        if (countAfter >= 10) return m; // Gained pieces
      }
    }

    return validMoves[0];
  }

  formatMove(move) {
    return `(${move.from.c + 1},${5 - move.from.r}) ➔ (${move.to.c + 1},${5 - move.to.r})`;
  }
}
