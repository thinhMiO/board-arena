import { BaseGame } from '../gameFramework/BaseGame.js';

export class XiangqiGame extends BaseGame {
  constructor() {
    super({
      id: 'xiangqi',
      name: 'Xiangqi',
      nameVi: 'Cờ Tướng',
      category: 'traditional',
      description: 'Môn cờ truyền thống phương Đông ngàn năm văn hiến. Sông Sở giới hạn, Cung cấm trang nghiêm.',
      rulesSummary: 'Bàn 9x10 với sông và cung. Tướng, Sĩ trong cung; Tượng không qua sông và bị cản mắt; Mã đi chữ nhật bị cản chân; Pháo nhảy qua quân để ăn.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Swords',
      coverGradient: 'from-red-900 to-amber-950',
      variants: [{ id: 'standard', name: 'Cờ tướng tiêu chuẩn' }],
      defaultSettings: {}
    });
  }

  init() {
    // 0: Red (bottom, rows 5-9), 1: Black (top, rows 0-4)
    // Pieces: K (Tướng), A (Sĩ), E (Tượng), H (Mã), R (Xe), C (Pháo), P (Tốt)
    const board = Array(10).fill(null).map(() => Array(9).fill(null));

    // Black setup (row 0 to 3)
    const bBack = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];
    for (let c = 0; c < 9; c++) board[0][c] = { type: bBack[c], color: 1 };
    board[2][1] = { type: 'C', color: 1 };
    board[2][7] = { type: 'C', color: 1 };
    for (let c = 0; c < 9; c += 2) board[3][c] = { type: 'P', color: 1 };

    // Red setup (row 9 to 6)
    const rBack = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];
    for (let c = 0; c < 9; c++) board[9][c] = { type: rBack[c], color: 0 };
    board[7][1] = { type: 'C', color: 0 };
    board[7][7] = { type: 'C', color: 0 };
    for (let c = 0; c < 9; c += 2) board[6][c] = { type: 'P', color: 0 };

    return {
      board,
      turn: 0, // 0: Red goes first
      inCheck: false,
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const pseudoMoves = [];
    const board = state.board;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = board[r][c];
        if (piece && piece.color === playerIndex) {
          switch (piece.type) {
            case 'K': this._getGeneralMoves(board, r, c, playerIndex, pseudoMoves); break;
            case 'A': this._getAdvisorMoves(board, r, c, playerIndex, pseudoMoves); break;
            case 'E': this._getElephantMoves(board, r, c, playerIndex, pseudoMoves); break;
            case 'H': this._getHorseMoves(board, r, c, playerIndex, pseudoMoves); break;
            case 'R': this._getChariotMoves(board, r, c, playerIndex, pseudoMoves); break;
            case 'C': this._getCannonMoves(board, r, c, playerIndex, pseudoMoves); break;
            case 'P': this._getPawnMoves(board, r, c, playerIndex, pseudoMoves); break;
          }
        }
      }
    }

    // Filter out moves that leave general in check or flying general confrontation
    return pseudoMoves.filter(m => !this._doesMoveExposeGeneral(state, m, playerIndex));
  }

  _getGeneralMoves(board, r, c, color, moves) {
    // Palace bounds: Red r: 7-9, c: 3-5; Black r: 0-2, c: 3-5
    const rMin = color === 0 ? 7 : 0;
    const rMax = color === 0 ? 9 : 2;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= rMin && nr <= rMax && nc >= 3 && nc <= 5) {
        if (!board[nr][nc] || board[nr][nc].color !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    }
  }

  _getAdvisorMoves(board, r, c, color, moves) {
    const rMin = color === 0 ? 7 : 0;
    const rMax = color === 0 ? 9 : 2;
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= rMin && nr <= rMax && nc >= 3 && nc <= 5) {
        if (!board[nr][nc] || board[nr][nc].color !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    }
  }

  _getElephantMoves(board, r, c, color, moves) {
    // Red rows: 5-9; Black rows: 0-4 (cannot cross river)
    const offsets = [
      { dr: -2, dc: -2, eyeR: -1, eyeC: -1 },
      { dr: -2, dc: 2, eyeR: -1, eyeC: 1 },
      { dr: 2, dc: -2, eyeR: 1, eyeC: -1 },
      { dr: 2, dc: 2, eyeR: 1, eyeC: 1 }
    ];
    for (const o of offsets) {
      const nr = r + o.dr, nc = c + o.dc;
      const eyeR = r + o.eyeR, eyeC = c + o.eyeC;
      const withinRiver = color === 0 ? (nr >= 5 && nr <= 9) : (nr >= 0 && nr <= 4);
      if (withinRiver && nc >= 0 && nc <= 8) {
        // Check elephant eye blocking (cản mắt tượng)
        if (board[eyeR][eyeC] === null) {
          if (!board[nr][nc] || board[nr][nc].color !== color) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
        }
      }
    }
  }

  _getHorseMoves(board, r, c, color, moves) {
    // Horse steps with leg blocking (cản chân mã)
    const offsets = [
      { dr: -2, dc: -1, legR: -1, legC: 0 },
      { dr: -2, dc: 1, legR: -1, legC: 0 },
      { dr: 2, dc: -1, legR: 1, legC: 0 },
      { dr: 2, dc: 1, legR: 1, legC: 0 },
      { dr: -1, dc: -2, legR: 0, legC: -1 },
      { dr: 1, dc: -2, legR: 0, legC: -1 },
      { dr: -1, dc: 2, legR: 0, legC: 1 },
      { dr: 1, dc: 2, legR: 0, legC: 1 }
    ];
    for (const o of offsets) {
      const nr = r + o.dr, nc = c + o.dc;
      const legR = r + o.legR, legC = c + o.legC;
      if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
        if (board[legR][legC] === null) {
          if (!board[nr][nc] || board[nr][nc].color !== color) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
        }
      }
    }
  }

  _getChariotMoves(board, r, c, color, moves) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
        if (board[nr][nc] === null) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        } else {
          if (board[nr][nc].color !== color) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
          break;
        }
        nr += dr; nc += dc;
      }
    }
  }

  _getCannonMoves(board, r, c, color, moves) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let nr = r + dr, nc = c + dc;
      let jumped = false;
      while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
        if (!jumped) {
          if (board[nr][nc] === null) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else {
            jumped = true; // Found screen to jump
          }
        } else {
          if (board[nr][nc] !== null) {
            if (board[nr][nc].color !== color) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            }
            break;
          }
        }
        nr += dr; nc += dc;
      }
    }
  }

  _getPawnMoves(board, r, c, color, moves) {
    const fwd = color === 0 ? -1 : 1;
    const crossedRiver = color === 0 ? r <= 4 : r >= 5;

    // Forward move
    const nr = r + fwd;
    if (nr >= 0 && nr <= 9) {
      if (!board[nr][c] || board[nr][c].color !== color) {
        moves.push({ from: { r, c }, to: { r: nr, c } });
      }
    }

    // Sideways if crossed river
    if (crossedRiver) {
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (nc >= 0 && nc <= 8) {
          if (!board[r][nc] || board[r][nc].color !== color) {
            moves.push({ from: { r, c }, to: { r, c: nc } });
          }
        }
      }
    }
  }

  _doesMoveExposeGeneral(state, move, color) {
    const testBoard = this.cloneState(state.board);
    const piece = testBoard[move.from.r][move.from.c];
    testBoard[move.from.r][move.from.c] = null;
    testBoard[move.to.r][move.to.c] = piece;

    // 1. Check Flying General confrontation (Lộ mặt tướng)
    let rGeneral = null, bGeneral = null;
    for (let r = 0; r <= 9; r++) {
      for (let c = 3; c <= 5; c++) {
        const p = testBoard[r][c];
        if (p && p.type === 'K') {
          if (p.color === 0) rGeneral = { r, c };
          else bGeneral = { r, c };
        }
      }
    }
    if (rGeneral && bGeneral && rGeneral.c === bGeneral.c) {
      let blocked = false;
      for (let r = bGeneral.r + 1; r < rGeneral.r; r++) {
        if (testBoard[r][rGeneral.c] !== null) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return true; // Direct confrontation is illegal
    }

    // 2. Check if general is attacked
    const myGen = color === 0 ? rGeneral : bGeneral;
    if (!myGen) return true;
    return this._isXiangqiSquareAttacked(testBoard, myGen.r, myGen.c, 1 - color);
  }

  _isXiangqiSquareAttacked(board, r, c, attackerColor) {
    // Attacked by Chariot or Cannon?
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let nr = r + dr, nc = c + dc;
      let countBetween = 0;
      while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
        const p = board[nr][nc];
        if (p !== null) {
          if (countBetween === 0) {
            if (p.color === attackerColor && (p.type === 'R' || p.type === 'K')) return true;
          } else if (countBetween === 1) {
            if (p.color === attackerColor && p.type === 'C') return true;
            break;
          }
          countBetween++;
        }
        nr += dr; nc += dc;
      }
    }

    // Attacked by Horse?
    const horseOffsets = [
      { dr: -2, dc: -1, legR: -1, legC: 0 },
      { dr: -2, dc: 1, legR: -1, legC: 0 },
      { dr: 2, dc: -1, legR: 1, legC: 0 },
      { dr: 2, dc: 1, legR: 1, legC: 0 },
      { dr: -1, dc: -2, legR: 0, legC: -1 },
      { dr: 1, dc: -2, legR: 0, legC: -1 },
      { dr: -1, dc: 2, legR: 0, legC: 1 },
      { dr: 1, dc: 2, legR: 0, legC: 1 }
    ];
    for (const o of horseOffsets) {
      const hr = r + o.dr, hc = c + o.dc;
      const legR = r + o.legR, legC = c + o.legC;
      if (hr >= 0 && hr <= 9 && hc >= 0 && hc <= 8) {
        const p = board[hr][hc];
        if (p && p.color === attackerColor && p.type === 'H' && board[legR][legC] === null) {
          return true;
        }
      }
    }

    // Attacked by Pawn?
    const pFwd = attackerColor === 0 ? -1 : 1;
    // Opposite of attacker pawn forward
    const pawnRow = r - pFwd;
    if (pawnRow >= 0 && pawnRow <= 9) {
      const p = board[pawnRow][c];
      if (p && p.color === attackerColor && p.type === 'P') return true;
    }
    for (const dc of [-1, 1]) {
      const pc = c + dc;
      if (pc >= 0 && pc <= 8) {
        const p = board[r][pc];
        if (p && p.color === attackerColor && p.type === 'P') {
          const crossedRiver = attackerColor === 0 ? r <= 4 : r >= 5;
          if (crossedRiver) return true;
        }
      }
    }

    return false;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Ván cờ đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const validMoves = this.getValidMoves(state, playerIndex);
    const valid = validMoves.some(m => 
      m.from.r === move.from.r && m.from.c === move.from.c &&
      m.to.r === move.to.r && m.to.c === move.to.c
    );

    if (!valid) return { nextState: state, valid: false, error: 'Nước đi không hợp lệ' };

    const nextState = this.cloneState(state);
    const piece = nextState.board[move.from.r][move.from.c];
    nextState.board[move.from.r][move.from.c] = null;
    nextState.board[move.to.r][move.to.c] = piece;
    nextState.lastMove = move;

    const nextPlayer = 1 - playerIndex;
    nextState.turn = nextPlayer;

    // Check if next player general is attacked
    let nextGen = null;
    for (let r = 0; r <= 9; r++) {
      for (let c = 3; c <= 5; c++) {
        const p = nextState.board[r][c];
        if (p && p.color === nextPlayer && p.type === 'K') {
          nextGen = { r, c }; break;
        }
      }
    }
    const inCheck = nextGen ? this._isXiangqiSquareAttacked(nextState.board, nextGen.r, nextGen.c, playerIndex) : false;
    nextState.inCheck = inCheck;

    const nextMoves = this.getValidMoves(nextState, nextPlayer);
    if (nextMoves.length === 0) {
      nextState.gameOver = true;
      nextState.winner = playerIndex;
      return {
        nextState,
        valid: true,
        result: {
          over: true,
          winner: playerIndex,
          reason: `Chiếu bí! Người chơi ${playerIndex === 0 ? 'Đỏ' : 'Đen'} chiến thắng vẻ vang!`
        }
      };
    }

    return { nextState, valid: true };
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    const values = { P: 100, A: 200, E: 200, H: 450, C: 450, R: 900, K: 10000 };
    validMoves.sort((a, b) => {
      const capA = state.board[a.to.r][a.to.c];
      const capB = state.board[b.to.r][b.to.c];
      const scoreA = (capA ? values[capA.type] * 2 : 0) + (a.to.r === 4 || a.to.r === 5 ? 20 : 0);
      const scoreB = (capB ? values[capB.type] * 2 : 0) + (b.to.r === 4 || b.to.r === 5 ? 20 : 0);
      return scoreB - scoreA;
    });

    return validMoves[0];
  }

  formatMove(move) {
    return `(${move.from.c + 1},${10 - move.from.r}) ➔ (${move.to.c + 1},${10 - move.to.r})`;
  }
}
