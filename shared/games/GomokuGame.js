import { BaseGame } from '../gameFramework/BaseGame.js';

export class GomokuGame extends BaseGame {
  constructor() {
    super({
      id: 'gomoku',
      name: 'Gomoku',
      nameVi: 'Cờ Caro',
      category: 'traditional',
      description: 'Trò chơi đặt quân 5 liên tiếp để giành chiến thắng. Phổ biến và kịch tính bậc nhất.',
      rulesSummary: 'Hai người luân phiên đặt quân X (Đen) và O (Trắng). Bên nào tạo được 5 quân liên tiếp không bị chặn 2 đầu (hoặc luật tự do) trước sẽ thắng.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Grid',
      coverGradient: 'from-amber-600 to-red-800',
      variants: [
        { id: 'standard_15', name: 'Bàn cờ 15x15 (Tiêu chuẩn)' },
        { id: 'standard_19', name: 'Bàn cờ 19x19 (Cờ vây)' },
        { id: 'free_rule', name: 'Luật tự do (Chặn 2 đầu vẫn thắng)' }
      ],
      defaultSettings: { size: 15, blockBothEnds: true }
    });
  }

  init(options = {}) {
    const size = options.size || 15;
    const board = Array(size).fill(null).map(() => Array(size).fill(null));
    return {
      size,
      board,
      turn: 0, // 0: X (Black), 1: O (White)
      lastMove: null,
      winningLine: null,
      movesCount: 0,
      gameOver: false,
      winner: null,
      blockBothEnds: options.blockBothEnds !== false
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const moves = [];
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        if (state.board[r][c] === null) {
          moves.push({ r, c });
        }
      }
    }
    return moves;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) {
      return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    }
    if (state.turn !== playerIndex) {
      return { nextState: state, valid: false, error: 'Chưa đến lượt của bạn' };
    }
    const { r, c } = move;
    if (r < 0 || r >= state.size || c < 0 || c >= state.size || state.board[r][c] !== null) {
      return { nextState: state, valid: false, error: 'Ô này đã có quân hoặc không hợp lệ' };
    }

    const nextState = this.cloneState(state);
    const piece = playerIndex === 0 ? 'X' : 'O';
    nextState.board[r][c] = piece;
    nextState.lastMove = { r, c, piece };
    nextState.movesCount++;

    const winInfo = this._checkWin(nextState.board, r, c, piece, nextState.blockBothEnds);
    if (winInfo) {
      nextState.gameOver = true;
      nextState.winner = playerIndex;
      nextState.winningLine = winInfo.line;
      return {
        nextState,
        valid: true,
        result: { over: true, winner: playerIndex, reason: `Người chơi ${piece} đã tạo được hàng 5 quân chiến thắng!` }
      };
    }

    if (nextState.movesCount >= state.size * state.size) {
      nextState.gameOver = true;
      nextState.winner = null;
      return {
        nextState,
        valid: true,
        result: { over: true, winner: null, reason: 'Hòa cờ! Bàn cờ đã kín ô.' }
      };
    }

    nextState.turn = 1 - playerIndex;
    return { nextState, valid: true };
  }

  _checkWin(board, r, c, piece, blockBothEnds) {
    const directions = [
      [ [0, 1], [0, -1] ], // Ngang
      [ [1, 0], [-1, 0] ], // Dọc
      [ [1, 1], [-1, -1] ], // Chéo chính
      [ [1, -1], [-1, 1] ]  // Chéo phụ
    ];
    const size = board.length;

    for (const [d1, d2] of directions) {
      const line = [{ r, c }];
      let count = 1;

      // Hướng 1
      let blocked1 = false;
      let r1 = r + d1[0];
      let c1 = c + d1[1];
      while (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size && board[r1][c1] === piece) {
        line.push({ r: r1, c: c1 });
        count++;
        r1 += d1[0];
        c1 += d1[1];
      }
      if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size || (board[r1][c1] !== null && board[r1][c1] !== piece)) {
        blocked1 = true;
      }

      // Hướng 2
      let blocked2 = false;
      let r2 = r + d2[0];
      let c2 = c + d2[1];
      while (r2 >= 0 && r2 < size && c2 >= 0 && c2 < size && board[r2][c2] === piece) {
        line.push({ r: r2, c: c2 });
        count++;
        r2 += d2[0];
        c2 += d2[1];
      }
      if (r2 < 0 || r2 >= size || c2 < 0 || c2 >= size || (board[r2][c2] !== null && board[r2][c2] !== piece)) {
        blocked2 = true;
      }

      if (count >= 5) {
        if (blockBothEnds && count === 5 && blocked1 && blocked2) {
          continue; // Bị chặn 2 đầu theo luật Việt Nam
        }
        return { won: true, line };
      }
    }
    return null;
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    // First move: center
    if (state.movesCount === 0) {
      const mid = Math.floor(state.size / 2);
      return { r: mid, c: mid };
    }

    // Filter candidate moves near existing pieces (radius 2)
    const candidates = [];
    const size = state.size;
    const occupied = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (state.board[r][c] !== null) occupied.push({ r, c });
      }
    }

    const myPiece = playerIndex === 0 ? 'X' : 'O';
    const oppPiece = playerIndex === 0 ? 'O' : 'X';

    // Easy AI: random move near occupied cells
    if (difficulty === 'easy') {
      const nearMoves = validMoves.filter(m => 
        occupied.some(o => Math.abs(o.r - m.r) <= 2 && Math.abs(o.c - m.c) <= 2)
      );
      const list = nearMoves.length ? nearMoves : validMoves;
      return list[Math.floor(Math.random() * list.length)];
    }

    // Medium, Hard, Master: Heuristic evaluation of offensive and defensive threat patterns
    let bestMove = null;
    let bestScore = -Infinity;

    for (const m of validMoves) {
      // Must be within 2 tiles of any piece to save time
      const isNear = occupied.some(o => Math.abs(o.r - m.r) <= 2 && Math.abs(o.c - m.c) <= 2);
      if (!isNear && occupied.length > 0) continue;

      const myScore = this._evaluateCell(state.board, m.r, m.c, myPiece);
      const oppScore = this._evaluateCell(state.board, m.r, m.c, oppPiece);

      let totalScore = 0;
      if (difficulty === 'medium') {
        totalScore = myScore * 1.0 + oppScore * 0.9 + (Math.random() * 5);
      } else if (difficulty === 'hard') {
        totalScore = myScore * 1.2 + oppScore * 1.1;
      } else { // Master
        totalScore = myScore >= 10000 ? 50000 : (oppScore >= 10000 ? 40000 : myScore * 1.3 + oppScore * 1.15);
      }

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = m;
      }
    }

    return bestMove || validMoves[0];
  }

  _evaluateCell(board, r, c, piece) {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    let score = 0;
    const size = board.length;

    for (const [dr, dc] of directions) {
      let count = 1;
      let openEnds = 0;

      // Positive direction
      let r1 = r + dr;
      let c1 = c + dc;
      while (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size && board[r1][c1] === piece) {
        count++;
        r1 += dr;
        c1 += dc;
      }
      if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size && board[r1][c1] === null) {
        openEnds++;
      }

      // Negative direction
      let r2 = r - dr;
      let c2 = c - dc;
      while (r2 >= 0 && r2 < size && c2 >= 0 && c2 < size && board[r2][c2] === piece) {
        count++;
        r2 -= dr;
        c2 -= dc;
      }
      if (r2 >= 0 && r2 < size && c2 >= 0 && c2 < size && board[r2][c2] === null) {
        openEnds++;
      }

      if (count >= 5) score += 100000;
      else if (count === 4) score += openEnds === 2 ? 10000 : (openEnds === 1 ? 2500 : 0);
      else if (count === 3) score += openEnds === 2 ? 1500 : (openEnds === 1 ? 300 : 0);
      else if (count === 2) score += openEnds === 2 ? 100 : (openEnds === 1 ? 20 : 0);
    }
    return score;
  }

  formatMove(move) {
    return `${String.fromCharCode(65 + move.c)}${move.r + 1}`;
  }
}
