import { BaseGame } from '../gameFramework/BaseGame.js';

export class ConnectFourGame extends BaseGame {
  constructor() {
    super({
      id: 'connect_four',
      name: 'Connect Four',
      nameVi: 'Cờ 4 (Bốn quân thẳng hàng)',
      category: 'casual',
      description: 'Thả thẻ cờ vào các cột với trọng lực. Bên nào xếp được 4 quân thẳng hàng trước sẽ thắng.',
      rulesSummary: 'Bàn cờ 7 cột x 6 hàng. Thả thẻ vào cột còn trống, quân sẽ rơi xuống vị trí thấp nhất. Xếp 4 viên thẳng hàng (ngang, dọc hoặc chéo) để thắng.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'CircleDot',
      coverGradient: 'from-yellow-500 to-blue-700',
      variants: [
        { id: 'standard_7x6', name: 'Chuẩn 7x6' }
      ],
      defaultSettings: { cols: 7, rows: 6 }
    });
  }

  init(options = {}) {
    const cols = options.cols || 7;
    const rows = options.rows || 6;
    const board = Array(rows).fill(null).map(() => Array(cols).fill(null));
    return {
      cols,
      rows,
      board,
      turn: 0, // 0: Đỏ (Red), 1: Vàng (Yellow)
      lastMove: null,
      winningLine: null,
      gameOver: false,
      winner: null,
      movesCount: 0
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const validCols = [];
    for (let c = 0; c < state.cols; c++) {
      if (state.board[0][c] === null) {
        validCols.push({ col: c });
      }
    }
    return validCols;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt của bạn' };

    const { col } = move;
    if (col < 0 || col >= state.cols || state.board[0][col] !== null) {
      return { nextState: state, valid: false, error: 'Cột này đã đầy!' };
    }

    const nextState = this.cloneState(state);
    // Find gravity row
    let row = state.rows - 1;
    while (row >= 0 && nextState.board[row][col] !== null) {
      row--;
    }

    const piece = playerIndex === 0 ? 'R' : 'Y';
    nextState.board[row][col] = piece;
    nextState.lastMove = { row, col, piece };
    nextState.movesCount++;

    const winInfo = this._checkWin(nextState.board, row, col, piece);
    if (winInfo) {
      nextState.gameOver = true;
      nextState.winner = playerIndex;
      nextState.winningLine = winInfo.line;
      return {
        nextState,
        valid: true,
        result: { over: true, winner: playerIndex, reason: `Người chơi ${playerIndex === 0 ? 'Đỏ' : 'Vàng'} đã xếp được 4 quân thẳng hàng!` }
      };
    }

    if (nextState.movesCount >= state.rows * state.cols) {
      nextState.gameOver = true;
      nextState.winner = null;
      return {
        nextState,
        valid: true,
        result: { over: true, winner: null, reason: 'Hòa cờ! Bàn cờ đã đầy.' }
      };
    }

    nextState.turn = 1 - playerIndex;
    return { nextState, valid: true };
  }

  _checkWin(board, r, c, piece) {
    const directions = [
      [ [0, 1], [0, -1] ], // Ngang
      [ [1, 0], [-1, 0] ], // Dọc
      [ [1, 1], [-1, -1] ], // Chéo 1
      [ [1, -1], [-1, 1] ]  // Chéo 2
    ];
    const rows = board.length;
    const cols = board[0].length;

    for (const [d1, d2] of directions) {
      const line = [{ r, c }];
      let count = 1;

      let r1 = r + d1[0], c1 = c + d1[1];
      while (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && board[r1][c1] === piece) {
        line.push({ r: r1, c: c1 });
        count++;
        r1 += d1[0];
        c1 += d1[1];
      }

      let r2 = r + d2[0], c2 = c + d2[1];
      while (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols && board[r2][c2] === piece) {
        line.push({ r: r2, c: c2 });
        count++;
        r2 += d2[0];
        c2 += d2[1];
      }

      if (count >= 4) {
        return { won: true, line };
      }
    }
    return null;
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    const myPiece = playerIndex === 0 ? 'R' : 'Y';
    const oppPiece = playerIndex === 0 ? 'Y' : 'R';

    // 1. Can we win in this turn?
    for (const m of validMoves) {
      const sim = this.makeMove(state, m, playerIndex);
      if (sim.valid && sim.nextState.gameOver && sim.nextState.winner === playerIndex) {
        return m;
      }
    }

    // 2. Can opponent win next turn? Block them!
    for (const m of validMoves) {
      const sim = this.makeMove(state, m, 1 - playerIndex);
      if (sim.valid && sim.nextState.gameOver && sim.nextState.winner === (1 - playerIndex)) {
        return m;
      }
    }

    // Prefer center columns (col 3, 2, 4, 1, 5, 0, 6)
    const centerOrder = [3, 2, 4, 1, 5, 0, 6];
    validMoves.sort((a, b) => centerOrder.indexOf(a.col) - centerOrder.indexOf(b.col));
    return validMoves[0];
  }

  formatMove(move) {
    return `Cột ${move.col + 1}`;
  }
}
