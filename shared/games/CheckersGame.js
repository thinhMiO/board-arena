import { BaseGame } from '../gameFramework/BaseGame.js';

export class CheckersGame extends BaseGame {
  constructor() {
    super({
      id: 'checkers',
      name: 'Checkers / Draughts',
      nameVi: 'Cờ Đam',
      category: 'traditional',
      description: 'Trò chơi cờ đam cổ điển với cơ chế nhảy ăn quân và phong Vua phong phú.',
      rulesSummary: 'Đi chéo trên các ô màu sẫm. Ăn quân bằng cách nhảy qua quân đối phương vào ô trống ngay sau đó. Quân đi tới hàng cuối cùng của đối phương sẽ được phong Vua.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Shield',
      coverGradient: 'from-orange-700 to-amber-950',
      variants: [{ id: 'american', name: 'Cờ đam Mỹ (8x8)' }],
      defaultSettings: {}
    });
  }

  init() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // 0: Red (top, rows 0-2), 1: White (bottom, rows 5-7)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = { player: 0, isKing: false };
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = { player: 1, isKing: false };
      }
    }

    return {
      board,
      turn: 1, // White goes first
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const jumps = [];
    const normalMoves = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece && piece.player === playerIndex) {
          const pieceJumps = this._getPieceJumps(state.board, r, c, piece);
          jumps.push(...pieceJumps);

          const pieceNormals = this._getPieceNormals(state.board, r, c, piece);
          normalMoves.push(...pieceNormals);
        }
      }
    }

    // In standard checkers, captures are mandatory
    return jumps.length > 0 ? jumps : normalMoves;
  }

  _getPieceJumps(board, r, c, piece) {
    const jumps = [];
    const directions = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : (piece.player === 0 ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]]);

    for (const [dr, dc] of directions) {
      const midR = r + dr;
      const midC = c + dc;
      const landR = r + dr * 2;
      const landC = c + dc * 2;

      if (landR >= 0 && landR < 8 && landC >= 0 && landC < 8) {
        const midPiece = board[midR][midC];
        const landPiece = board[landR][landC];
        if (midPiece && midPiece.player !== piece.player && landPiece === null) {
          jumps.push({
            from: { r, c },
            to: { r: landR, c: landC },
            captured: { r: midR, c: midC },
            isJump: true
          });
        }
      }
    }
    return jumps;
  }

  _getPieceNormals(board, r, c, piece) {
    const normals = [];
    const directions = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : (piece.player === 0 ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]]);

    for (const [dr, dc] of directions) {
      const toR = r + dr;
      const toC = c + dc;
      if (toR >= 0 && toR < 8 && toC >= 0 && toC < 8 && board[toR][toC] === null) {
        normals.push({
          from: { r, c },
          to: { r: toR, c: toC },
          isJump: false
        });
      }
    }
    return normals;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const validMoves = this.getValidMoves(state, playerIndex);
    const isValid = validMoves.some(m => 
      m.from.r === move.from.r && m.from.c === move.from.c &&
      m.to.r === move.to.r && m.to.c === move.to.c
    );

    if (!isValid) {
      return { nextState: state, valid: false, error: 'Nước đi không hợp lệ' };
    }

    const nextState = this.cloneState(state);
    const piece = nextState.board[move.from.r][move.from.c];
    nextState.board[move.from.r][move.from.c] = null;

    // Check king promotion
    if ((playerIndex === 0 && move.to.r === 7) || (playerIndex === 1 && move.to.r === 0)) {
      piece.isKing = true;
    }
    nextState.board[move.to.r][move.to.c] = piece;

    if (move.captured) {
      nextState.board[move.captured.r][move.captured.c] = null;
    }
    nextState.lastMove = move;

    // Check multi-jump continuation
    if (move.isJump) {
      const furtherJumps = this._getPieceJumps(nextState.board, move.to.r, move.to.c, piece);
      if (furtherJumps.length > 0) {
        // Player continues jumping with the same piece
        return { nextState, valid: true, multiJump: true };
      }
    }

    // Switch turn
    const nextPlayer = 1 - playerIndex;
    nextState.turn = nextPlayer;

    // Check if next player has moves
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
          reason: `Người chơi ${playerIndex === 0 ? 'Đỏ' : 'Trắng'} chiến thắng vì đối thủ không còn nước đi!`
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

    // Prioritize jumps, then king promotions, then center control
    validMoves.sort((a, b) => {
      let scoreA = a.isJump ? 50 : 0;
      let scoreB = b.isJump ? 50 : 0;
      if (playerIndex === 0 && a.to.r === 7) scoreA += 30;
      if (playerIndex === 1 && a.to.r === 0) scoreA += 30;
      if (playerIndex === 0 && b.to.r === 7) scoreB += 30;
      if (playerIndex === 1 && b.to.r === 0) scoreB += 30;
      return scoreB - scoreA;
    });

    return validMoves[0];
  }

  formatMove(move) {
    return `${String.fromCharCode(65 + move.from.c)}${8 - move.from.r} ➔ ${String.fromCharCode(65 + move.to.c)}${8 - move.to.r}`;
  }
}
