import { BaseGame } from '../gameFramework/BaseGame.js';

export class ReversiGame extends BaseGame {
  constructor() {
    super({
      id: 'reversi',
      name: 'Reversi / Othello',
      nameVi: 'Cờ Lật (Othello)',
      category: 'strategy',
      description: 'Một phút để học, một đời để thành thạo. Kẹp quân đối thủ để đổi màu cờ về phe mình.',
      rulesSummary: 'Bàn 8x8. Đặt quân sao cho kẹp ít nhất 1 quân đối phương theo đường ngang, dọc, chéo để lật cờ. Khi hết nước đi cả 2 bên, ai nhiều cờ hơn người đó thắng.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Disc',
      coverGradient: 'from-emerald-700 to-teal-950',
      variants: [{ id: 'standard', name: 'Othello 8x8' }],
      defaultSettings: {}
    });
  }

  init() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Initial 4 pieces in center
    board[3][3] = 'W';
    board[3][4] = 'B';
    board[4][3] = 'B';
    board[4][4] = 'W';

    return {
      board,
      turn: 0, // 0: Black ('B'), 1: White ('W')
      gameOver: false,
      winner: null,
      score: { black: 2, white: 2 },
      lastMove: null
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const piece = playerIndex === 0 ? 'B' : 'W';
    const validMoves = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const flips = this._getFlips(state.board, r, c, piece);
        if (flips.length > 0) {
          validMoves.push({ r, c, flips });
        }
      }
    }
    return validMoves;
  }

  _getFlips(board, r, c, piece) {
    if (board[r][c] !== null) return [];
    const opp = piece === 'B' ? 'W' : 'B';
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    const totalFlips = [];

    for (const [dr, dc] of directions) {
      let cr = r + dr;
      let cc = c + dc;
      const path = [];

      while (cr >= 0 && cr < 8 && cc >= 0 && cc < 8 && board[cr][cc] === opp) {
        path.push({ r: cr, c: cc });
        cr += dr;
        cc += dc;
      }

      if (path.length > 0 && cr >= 0 && cr < 8 && cc >= 0 && cc < 8 && board[cr][cc] === piece) {
        totalFlips.push(...path);
      }
    }
    return totalFlips;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Ván đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const piece = playerIndex === 0 ? 'B' : 'W';
    const flips = this._getFlips(state.board, move.r, move.c, piece);

    if (flips.length === 0) {
      return { nextState: state, valid: false, error: 'Nước đi không hợp lệ, không lật được quân nào!' };
    }

    const nextState = this.cloneState(state);
    nextState.board[move.r][move.c] = piece;
    for (const f of flips) {
      nextState.board[f.r][f.c] = piece;
    }
    nextState.lastMove = { r: move.r, c: move.c, piece };

    // Update score
    let black = 0, white = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (nextState.board[r][c] === 'B') black++;
        if (nextState.board[r][c] === 'W') white++;
      }
    }
    nextState.score = { black, white };

    // Check if next player has moves
    const nextPlayer = 1 - playerIndex;
    const nextValid = this.getValidMoves({ ...nextState, turn: nextPlayer }, nextPlayer);

    if (nextValid.length > 0) {
      nextState.turn = nextPlayer;
      return { nextState, valid: true };
    }

    // Next player has no moves: Check if current player can move (pass)
    const currentValid = this.getValidMoves({ ...nextState, turn: playerIndex }, playerIndex);
    if (currentValid.length > 0) {
      // Pass turn back to current player
      nextState.turn = playerIndex;
      return { nextState, valid: true, pass: true };
    }

    // Both have no moves: GAME OVER
    nextState.gameOver = true;
    if (black > white) {
      nextState.winner = 0;
    } else if (white > black) {
      nextState.winner = 1;
    } else {
      nextState.winner = null;
    }

    return {
      nextState,
      valid: true,
      result: {
        over: true,
        winner: nextState.winner,
        reason: `Trận đấu kết thúc! Đen: ${black} - Trắng: ${white}. ${nextState.winner !== null ? `Người chơi ${nextState.winner === 0 ? 'Đen' : 'Trắng'} thắng!` : 'Hòa cờ!'}`
      }
    };
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Positional weight matrix for Othello
    const weights = [
      [ 100, -20,  10,   5,   5,  10, -20, 100 ],
      [ -20, -50,  -2,  -2,  -2,  -2, -50, -20 ],
      [  10,  -2,  -1,  -1,  -1,  -1,  -2,  10 ],
      [   5,  -2,  -1,   0,   0,  -1,  -2,   5 ],
      [   5,  -2,  -1,   0,   0,  -1,  -2,   5 ],
      [  10,  -2,  -1,  -1,  -1,  -1,  -2,  10 ],
      [ -20, -50,  -2,  -2,  -2,  -2, -50, -20 ],
      [ 100, -20,  10,   5,   5,  10, -20, 100 ]
    ];

    let bestMove = validMoves[0];
    let maxVal = -Infinity;

    for (const m of validMoves) {
      let val = weights[m.r][m.c] + m.flips.length;
      if (difficulty === 'master') {
        // Corners are golden
        if ((m.r === 0 || m.r === 7) && (m.c === 0 || m.c === 7)) val += 300;
      }
      if (val > maxVal) {
        maxVal = val;
        bestMove = m;
      }
    }
    return bestMove;
  }

  formatMove(move) {
    return `${String.fromCharCode(65 + move.c)}${move.r + 1}`;
  }
}
