import { BaseGame } from '../gameFramework/BaseGame.js';

export class ShogiGame extends BaseGame {
  constructor() {
    super({
      id: 'shogi',
      name: 'Shogi',
      nameVi: 'Cờ Tướng Nhật Bản (Shogi)',
      category: 'strategy',
      description: 'Trò chơi cờ độc đáo của Nhật Bản với cơ chế tái sử dụng quân cờ đã bắt (thả quân).',
      rulesSummary: 'Bàn 9x9. Quân cờ hình nêm ngũ giác. Đặc biệt: quân bắt được từ đối phương được giữ trên tay và có thể thả lại vào bất kỳ ô trống nào trên bàn cờ. Phong cấp khi tiến vào 3 hàng đối phương.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'JapaneseYen',
      coverGradient: 'from-amber-800 to-yellow-950',
      variants: [{ id: 'standard', name: 'Shogi tiêu chuẩn (9x9)' }],
      defaultSettings: {}
    });
  }

  init() {
    // 0: Sente (Black/First, rows 6-8), 1: Gote (White/Second, rows 0-2)
    const board = Array(9).fill(null).map(() => Array(9).fill(null));
    // Pieces: K (King), R (Rook), B (Bishop), G (Gold), S (Silver), N (Knight), L (Lance), P (Pawn)
    // Row 0 Gote
    board[0][0] = { type: 'L', color: 1, promoted: false };
    board[0][1] = { type: 'N', color: 1, promoted: false };
    board[0][2] = { type: 'S', color: 1, promoted: false };
    board[0][3] = { type: 'G', color: 1, promoted: false };
    board[0][4] = { type: 'K', color: 1, promoted: false };
    board[0][5] = { type: 'G', color: 1, promoted: false };
    board[0][6] = { type: 'S', color: 1, promoted: false };
    board[0][7] = { type: 'N', color: 1, promoted: false };
    board[0][8] = { type: 'L', color: 1, promoted: false };
    board[1][1] = { type: 'B', color: 1, promoted: false };
    board[1][7] = { type: 'R', color: 1, promoted: false };
    for (let c = 0; c < 9; c++) board[2][c] = { type: 'P', color: 1, promoted: false };

    // Row 8 Sente
    board[8][0] = { type: 'L', color: 0, promoted: false };
    board[8][1] = { type: 'N', color: 0, promoted: false };
    board[8][2] = { type: 'S', color: 0, promoted: false };
    board[8][3] = { type: 'G', color: 0, promoted: false };
    board[8][4] = { type: 'K', color: 0, promoted: false };
    board[8][5] = { type: 'G', color: 0, promoted: false };
    board[8][6] = { type: 'S', color: 0, promoted: false };
    board[8][7] = { type: 'N', color: 0, promoted: false };
    board[8][8] = { type: 'L', color: 0, promoted: false };
    board[7][1] = { type: 'R', color: 0, promoted: false };
    board[7][7] = { type: 'B', color: 0, promoted: false };
    for (let c = 0; c < 9; c++) board[6][c] = { type: 'P', color: 0, promoted: false };

    return {
      board,
      turn: 0,
      hand: {
        0: [], // captured pieces in hand for player 0
        1: []  // captured pieces in hand for player 1
      },
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const moves = [];
    const board = state.board;

    // 1. Board moves
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = board[r][c];
        if (piece && piece.color === playerIndex) {
          this._getPieceMoves(board, r, c, piece, playerIndex, moves);
        }
      }
    }

    // 2. Drop moves from hand
    const myHand = state.hand[playerIndex] || [];
    const uniquePiecesInHand = Array.from(new Set(myHand));

    for (const pType of uniquePiecesInHand) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === null) {
            // Cannot drop pawn on last rank
            if (pType === 'P' && ((playerIndex === 0 && r === 0) || (playerIndex === 1 && r === 8))) continue;
            // Cannot drop knight on last 2 ranks
            if (pType === 'N' && ((playerIndex === 0 && r <= 1) || (playerIndex === 1 && r >= 7))) continue;
            // Two pawns in same file (Nifu rule)
            if (pType === 'P') {
              let hasUnpromotedPawnInFile = false;
              for (let checkR = 0; checkR < 9; checkR++) {
                const checkP = board[checkR][c];
                if (checkP && checkP.color === playerIndex && checkP.type === 'P' && !checkP.promoted) {
                  hasUnpromotedPawnInFile = true;
                  break;
                }
              }
              if (hasUnpromotedPawnInFile) continue;
            }
            moves.push({ isDrop: true, pieceType: pType, to: { r, c } });
          }
        }
      }
    }

    return moves;
  }

  _getPieceMoves(board, r, c, piece, color, moves) {
    const fwd = color === 0 ? -1 : 1;
    const type = piece.type;
    const isPromoted = piece.promoted;

    if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && (!board[nr][nc] || board[nr][nc].color !== color)) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
        }
      }
    } else if (type === 'G' || (isPromoted && ['S', 'N', 'L', 'P'].includes(type))) {
      // Gold general moves (4 orthogonal + 2 forward diagonals)
      const goldOffsets = [
        [fwd, -1], [fwd, 0], [fwd, 1],
        [0, -1],             [0, 1],
        [-fwd, 0]
      ];
      for (const [dr, dc] of goldOffsets) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && (!board[nr][nc] || board[nr][nc].color !== color)) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    } else if (type === 'S' && !isPromoted) {
      // Silver: 3 forward + 2 rear diagonals
      const silverOffsets = [
        [fwd, -1], [fwd, 0], [fwd, 1],
        [-fwd, -1],          [-fwd, 1]
      ];
      for (const [dr, dc] of silverOffsets) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && (!board[nr][nc] || board[nr][nc].color !== color)) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    } else if (type === 'P' && !isPromoted) {
      const nr = r + fwd;
      if (nr >= 0 && nr < 9 && (!board[nr][c] || board[nr][c].color !== color)) {
        moves.push({ from: { r, c }, to: { r: nr, c } });
      }
    } else if (type === 'N' && !isPromoted) {
      // Knight leaps 2 forward, 1 sideways
      const nr = r + fwd * 2;
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && (!board[nr][nc] || board[nr][nc].color !== color)) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    } else if (type === 'R') {
      // Rook orthogonal sliding
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          if (!board[nr][nc]) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else {
            if (board[nr][nc].color !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            break;
          }
          nr += dr; nc += dc;
        }
      }
      if (isPromoted) {
        // Promoted Rook gets diagonal 1 step
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && (!board[nr][nc] || board[nr][nc].color !== color)) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
        }
      }
    } else if (type === 'B') {
      // Bishop diagonal sliding
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          if (!board[nr][nc]) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else {
            if (board[nr][nc].color !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            break;
          }
          nr += dr; nc += dc;
        }
      }
      if (isPromoted) {
        // Promoted Bishop gets orthogonal 1 step
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && (!board[nr][nc] || board[nr][nc].color !== color)) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          }
        }
      }
    } else if (type === 'L' && !isPromoted) {
      // Lance forward sliding
      let nr = r + fwd;
      while (nr >= 0 && nr < 9) {
        if (!board[nr][c]) {
          moves.push({ from: { r, c }, to: { r: nr, c } });
        } else {
          if (board[nr][c].color !== color) moves.push({ from: { r, c }, to: { r: nr, c } });
          break;
        }
        nr += fwd;
      }
    }
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const nextState = this.cloneState(state);

    if (move.isDrop) {
      // Drop piece from hand
      const handList = nextState.hand[playerIndex] || [];
      const idx = handList.indexOf(move.pieceType);
      if (idx === -1 || nextState.board[move.to.r][move.to.c] !== null) {
        return { nextState: state, valid: false, error: 'Không thể thả quân này' };
      }
      handList.splice(idx, 1);
      nextState.board[move.to.r][move.to.c] = {
        type: move.pieceType,
        color: playerIndex,
        promoted: false
      };
      nextState.lastMove = move;
    } else {
      const piece = nextState.board[move.from.r][move.from.c];
      if (!piece || piece.color !== playerIndex) {
        return { nextState: state, valid: false, error: 'Quân cờ không hợp lệ' };
      }
      nextState.board[move.from.r][move.from.c] = null;

      // Capture opponent piece
      const target = nextState.board[move.to.r][move.to.c];
      if (target) {
        if (target.type === 'K') {
          // King captured: win!
          nextState.board[move.to.r][move.to.c] = piece;
          nextState.gameOver = true;
          nextState.winner = playerIndex;
          return {
            nextState,
            valid: true,
            result: { over: true, winner: playerIndex, reason: `Bắt được Vua đối phương! Người chơi ${playerIndex === 0 ? 'Tiên (Sente)' : 'Hậu (Gote)'} chiến thắng!` }
          };
        }
        // Demote captured piece and put in hand
        nextState.hand[playerIndex].push(target.type);
      }

      // Check promotion (ranks 0-2 for Sente, 6-8 for Gote)
      const promoZone = playerIndex === 0 ? move.to.r <= 2 : move.to.r >= 6;
      if (promoZone && !piece.promoted && ['R', 'B', 'S', 'N', 'L', 'P'].includes(piece.type)) {
        piece.promoted = true;
      }
      nextState.board[move.to.r][move.to.c] = piece;
      nextState.lastMove = move;
    }

    nextState.turn = 1 - playerIndex;
    return { nextState, valid: true };
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Capture priority
    for (const m of validMoves) {
      if (!m.isDrop && state.board[m.to.r][m.to.c]) {
        return m;
      }
    }
    return validMoves[0];
  }

  formatMove(move) {
    if (move.isDrop) {
      return `Thả ${move.pieceType} vào (${9 - move.to.c},${move.to.r + 1})`;
    }
    return `(${9 - move.from.c},${move.from.r + 1}) ➔ (${9 - move.to.c},${move.to.r + 1})`;
  }
}
