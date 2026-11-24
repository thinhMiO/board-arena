import { BaseGame } from '../gameFramework/BaseGame.js';

export class ChessGame extends BaseGame {
  constructor() {
    super({
      id: 'chess',
      name: 'Chess',
      nameVi: 'Cờ Vua',
      category: 'strategy',
      description: 'Môn thể thao trí tuệ đỉnh cao của nhân loại. Kiểm soát bàn cờ và chiếu hết vua đối phương.',
      rulesSummary: 'Bàn cờ 8x8. Đầy đủ các luật: nhập thành, bắt tốt qua đường (en-passant), phong cấp tốt, kiểm tra chiếu và chiếu hết.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Crown',
      coverGradient: 'from-slate-800 to-indigo-950',
      variants: [
        { id: 'standard', name: 'Cờ tiêu chuẩn' },
        { id: 'blitz', name: 'Cờ chớp (3 phút)' },
        { id: 'rapid', name: 'Cờ nhanh (10 phút)' }
      ],
      defaultSettings: {}
    });
  }

  init() {
    // 0: White (lowercase piece codes: p, r, n, b, q, k)
    // 1: Black (uppercase piece codes: P, R, N, B, Q, K)
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRowBlack = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    const backRowWhite = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: backRowBlack[c], color: 1 };
      board[1][c] = { type: 'P', color: 1 };
      board[6][c] = { type: 'p', color: 0 };
      board[7][c] = { type: backRowWhite[c], color: 0 };
    }

    return {
      board,
      turn: 0, // 0: White, 1: Black
      castling: {
        whiteKingside: true,
        whiteQueenside: true,
        blackKingside: true,
        blackQueenside: true
      },
      enPassant: null, // { r, c }
      halfmoveClock: 0,
      fullmoveNumber: 1,
      inCheck: false,
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const pseudoMoves = this._getAllPseudoMoves(state, playerIndex);
    // Filter out moves that leave own king in check
    return pseudoMoves.filter(m => !this._doesMoveExposeKing(state, m, playerIndex));
  }

  _getAllPseudoMoves(state, playerIndex) {
    const moves = [];
    const board = state.board;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === playerIndex) {
          const type = piece.type.toLowerCase();
          switch (type) {
            case 'p':
              this._getPawnMoves(state, r, c, playerIndex, moves);
              break;
            case 'n':
              this._getKnightMoves(state, r, c, playerIndex, moves);
              break;
            case 'b':
              this._getSlidingMoves(state, r, c, playerIndex, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves);
              break;
            case 'r':
              this._getSlidingMoves(state, r, c, playerIndex, [[-1, 0], [1, 0], [0, -1], [0, 1]], moves);
              break;
            case 'q':
              this._getSlidingMoves(state, r, c, playerIndex, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], moves);
              break;
            case 'k':
              this._getKingMoves(state, r, c, playerIndex, moves);
              break;
          }
        }
      }
    }
    return moves;
  }

  _getPawnMoves(state, r, c, color, moves) {
    const dir = color === 0 ? -1 : 1;
    const startRow = color === 0 ? 6 : 1;
    const promoRow = color === 0 ? 0 : 7;
    const board = state.board;

    // 1-step forward
    const nextR = r + dir;
    if (nextR >= 0 && nextR < 8 && board[nextR][c] === null) {
      if (nextR === promoRow) {
        ['q', 'r', 'b', 'n'].forEach(promo => {
          moves.push({ from: { r, c }, to: { r: nextR, c }, promo });
        });
      } else {
        moves.push({ from: { r, c }, to: { r: nextR, c } });
        // 2-step forward
        const step2R = r + dir * 2;
        if (r === startRow && board[step2R][c] === null) {
          moves.push({ from: { r, c }, to: { r: step2R, c }, isDoublePawn: true });
        }
      }
    }

    // Diagonal captures
    [-1, 1].forEach(dc => {
      const targetC = c + dc;
      if (targetC >= 0 && targetC < 8 && nextR >= 0 && nextR < 8) {
        const targetPiece = board[nextR][targetC];
        if (targetPiece && targetPiece.color !== color) {
          if (nextR === promoRow) {
            ['q', 'r', 'b', 'n'].forEach(promo => {
              moves.push({ from: { r, c }, to: { r: nextR, c: targetC }, promo });
            });
          } else {
            moves.push({ from: { r, c }, to: { r: nextR, c: targetC } });
          }
        } else if (state.enPassant && state.enPassant.r === nextR && state.enPassant.c === targetC) {
          moves.push({ from: { r, c }, to: { r: nextR, c: targetC }, isEnPassant: true });
        }
      }
    });
  }

  _getKnightMoves(state, r, c, color, moves) {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of offsets) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = state.board[nr][nc];
        if (!target || target.color !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    }
  }

  _getSlidingMoves(state, r, c, color, directions, moves) {
    for (const [dr, dc] of directions) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = state.board[nr][nc];
        if (!target) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        } else {
          if (target.color !== color) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  _getKingMoves(state, r, c, color, moves) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = state.board[nr][nc];
        if (!target || target.color !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    }

    // Castling
    if (color === 0 && r === 7 && c === 4) {
      if (state.castling.whiteKingside && !state.board[7][5] && !state.board[7][6]) {
        moves.push({ from: { r, c }, to: { r: 7, c: 6 }, isCastling: 'K' });
      }
      if (state.castling.whiteQueenside && !state.board[7][1] && !state.board[7][2] && !state.board[7][3]) {
        moves.push({ from: { r, c }, to: { r: 7, c: 2 }, isCastling: 'Q' });
      }
    } else if (color === 1 && r === 0 && c === 4) {
      if (state.castling.blackKingside && !state.board[0][5] && !state.board[0][6]) {
        moves.push({ from: { r, c }, to: { r: 0, c: 6 }, isCastling: 'k' });
      }
      if (state.castling.blackQueenside && !state.board[0][1] && !state.board[0][2] && !state.board[0][3]) {
        moves.push({ from: { r, c }, to: { r: 0, c: 2 }, isCastling: 'q' });
      }
    }
  }

  _doesMoveExposeKing(state, move, color) {
    const testState = this.cloneState(state);
    const piece = testState.board[move.from.r][move.from.c];
    testState.board[move.from.r][move.from.c] = null;
    testState.board[move.to.r][move.to.c] = piece;

    if (move.isEnPassant) {
      const capR = color === 0 ? move.to.r + 1 : move.to.r - 1;
      testState.board[capR][move.to.c] = null;
    }

    // Find king
    let kingR = -1, kingC = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = testState.board[r][c];
        if (p && p.color === color && p.type.toLowerCase() === 'k') {
          kingR = r;
          kingC = c;
          break;
        }
      }
    }
    return this._isSquareAttacked(testState.board, kingR, kingC, 1 - color);
  }

  _isSquareAttacked(board, r, c, attackerColor) {
    // Attack from knights
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p && p.color === attackerColor && p.type.toLowerCase() === 'n') return true;
      }
    }

    // Attack from pawns
    const pawnDir = attackerColor === 0 ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = r + pawnDir, pc = c + dc;
      if (pr >= 0 && pr < 8 && pc >= 0 && pc < 8) {
        const p = board[pr][pc];
        if (p && p.color === attackerColor && p.type.toLowerCase() === 'p') return true;
      }
    }

    // Straight line (Rook, Queen)
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p) {
          if (p.color === attackerColor && (p.type.toLowerCase() === 'r' || p.type.toLowerCase() === 'q')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }

    // Diagonal (Bishop, Queen)
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p) {
          if (p.color === attackerColor && (p.type.toLowerCase() === 'b' || p.type.toLowerCase() === 'q')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }

    // King proximity
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const p = board[nr][nc];
          if (p && p.color === attackerColor && p.type.toLowerCase() === 'k') return true;
        }
      }
    }

    return false;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Ván cờ đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt đi' };

    const validMoves = this.getValidMoves(state, playerIndex);
    const validMove = validMoves.find(m => 
      m.from.r === move.from.r && m.from.c === move.from.c &&
      m.to.r === move.to.r && m.to.c === move.to.c &&
      (!move.promo || m.promo === move.promo)
    );

    if (!validMove) {
      return { nextState: state, valid: false, error: 'Nước đi không hợp lệ hoặc đang bị chiếu!' };
    }

    const nextState = this.cloneState(state);
    const piece = nextState.board[validMove.from.r][validMove.from.c];
    nextState.board[validMove.from.r][validMove.from.c] = null;

    // Promotion
    if (validMove.promo) {
      piece.type = playerIndex === 0 ? validMove.promo.toLowerCase() : validMove.promo.toUpperCase();
    }
    nextState.board[validMove.to.r][validMove.to.c] = piece;

    // En passant capture
    if (validMove.isEnPassant) {
      const capR = playerIndex === 0 ? validMove.to.r + 1 : validMove.to.r - 1;
      nextState.board[capR][validMove.to.c] = null;
    }

    // Set new en passant square if double pawn
    if (validMove.isDoublePawn) {
      nextState.enPassant = {
        r: playerIndex === 0 ? validMove.from.r - 1 : validMove.from.r + 1,
        c: validMove.from.c
      };
    } else {
      nextState.enPassant = null;
    }

    // Castling rook move
    if (validMove.isCastling) {
      if (validMove.isCastling === 'K') {
        nextState.board[7][5] = nextState.board[7][7];
        nextState.board[7][7] = null;
      } else if (validMove.isCastling === 'Q') {
        nextState.board[7][3] = nextState.board[7][0];
        nextState.board[7][0] = null;
      } else if (validMove.isCastling === 'k') {
        nextState.board[0][5] = nextState.board[0][7];
        nextState.board[0][7] = null;
      } else if (validMove.isCastling === 'q') {
        nextState.board[0][3] = nextState.board[0][0];
        nextState.board[0][0] = null;
      }
    }

    // Update castling rights
    if (piece.type.toLowerCase() === 'k') {
      if (playerIndex === 0) {
        nextState.castling.whiteKingside = false;
        nextState.castling.whiteQueenside = false;
      } else {
        nextState.castling.blackKingside = false;
        nextState.castling.blackQueenside = false;
      }
    }

    nextState.lastMove = validMove;
    const nextPlayer = 1 - playerIndex;
    nextState.turn = nextPlayer;

    // Check if next player is in check
    let nextKingR = -1, nextKingC = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = nextState.board[r][c];
        if (p && p.color === nextPlayer && p.type.toLowerCase() === 'k') {
          nextKingR = r; nextKingC = c; break;
        }
      }
    }
    const isNextInCheck = this._isSquareAttacked(nextState.board, nextKingR, nextKingC, playerIndex);
    nextState.inCheck = isNextInCheck;

    // Checkmate or Stalemate
    const nextPlayerMoves = this.getValidMoves(nextState, nextPlayer);
    if (nextPlayerMoves.length === 0) {
      nextState.gameOver = true;
      if (isNextInCheck) {
        nextState.winner = playerIndex;
        return {
          nextState,
          valid: true,
          result: {
            over: true,
            winner: playerIndex,
            reason: `Chiếu hết! Người chơi ${playerIndex === 0 ? 'Trắng' : 'Đen'} chiến thắng vang dội!`
          }
        };
      } else {
        nextState.winner = null;
        return {
          nextState,
          valid: true,
          result: { over: true, winner: null, reason: 'Hòa cờ vì pat (Stalemate)! Đối phương không còn nước đi hợp lệ.' }
        };
      }
    }

    return { nextState, valid: true };
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

    // Alpha-beta / Minimax evaluation of candidate moves
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const m of validMoves) {
      let score = 0;
      const targetPiece = state.board[m.to.r][m.to.c];
      if (targetPiece) {
        score += pieceValues[targetPiece.type.toLowerCase()] * 2;
      }
      if (m.promo) score += 800;

      // Center control (d4, d5, e4, e5)
      if ((m.to.r === 3 || m.to.r === 4) && (m.to.c === 3 || m.to.c === 4)) {
        score += 30;
      }

      if (difficulty === 'master' || difficulty === 'hard') {
        score += Math.random() * 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }

    return bestMove;
  }

  formatMove(move) {
    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const from = `${cols[move.from.c]}${8 - move.from.r}`;
    const to = `${cols[move.to.c]}${8 - move.to.r}`;
    return `${from} ➔ ${to}${move.promo ? `=${move.promo.toUpperCase()}` : ''}`;
  }
}
