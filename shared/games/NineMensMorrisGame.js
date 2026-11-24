import { BaseGame } from '../gameFramework/BaseGame.js';

export class NineMensMorrisGame extends BaseGame {
  constructor() {
    super({
      id: 'nine_mens_morris',
      name: "Nine Men's Morris",
      nameVi: 'Cờ Chín Quân (Morris)',
      category: 'traditional',
      description: 'Trò chơi xếp 3 quân thẳng hàng kinh điển từ thời La Mã cổ đại. Ăn quân khi tạo hàng và cơ chế bay tự do.',
      rulesSummary: '24 điểm giao trên 3 hình vuông đồng tâm. Giai đoạn 1: Lần lượt đặt 9 quân lên bàn. Giai đoạn 2: Di chuyển quân theo đường nối. Tạo được hàng 3 quân (Mill) được quyền bắt 1 quân của đối thủ. Khi chỉ còn 3 quân được bay tự do.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'SquareDot',
      coverGradient: 'from-purple-800 to-indigo-950',
      variants: [{ id: 'standard', name: "Nine Men's Morris 9 quân" }],
      defaultSettings: {}
    });
  }

  init() {
    // 24 points: index 0 to 23
    // Outer: 0-7, Middle: 8-15, Inner: 16-23
    const points = Array(24).fill(null);

    return {
      points,
      turn: 0, // 0: Player 0 (Blue), 1: Player 1 (Orange)
      phase: 'placing', // 'placing' | 'moving'
      placedPieces: { 0: 0, 1: 0 },
      alivePieces: { 0: 9, 1: 9 },
      mustRemoveOpponent: false,
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  // 24 points graph adjacency list
  static ADJACENCY = {
    0: [1, 7], 1: [0, 2, 9], 2: [1, 3], 3: [2, 4, 11], 4: [3, 5], 5: [4, 6, 13], 6: [5, 7], 7: [6, 0, 15],
    8: [9, 15], 9: [8, 10, 1, 17], 10: [9, 11], 11: [10, 12, 3, 19], 12: [11, 13], 13: [12, 14, 5, 21], 14: [13, 15], 15: [14, 8, 7, 23],
    16: [17, 23], 17: [16, 18, 9], 18: [17, 19], 19: [18, 20, 11], 20: [19, 21], 21: [20, 22, 13], 22: [21, 23], 23: [22, 16, 15]
  };

  // 16 possible mills (lines of 3)
  static MILLS = [
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],       // Outer
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8], // Middle
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16], // Inner
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23] // Cross lines
  ];

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const opp = 1 - playerIndex;

    // If player just formed a mill, they must remove 1 opponent piece!
    if (state.mustRemoveOpponent) {
      const removable = [];
      for (let i = 0; i < 24; i++) {
        if (state.points[i] === opp) {
          removable.push({ action: 'remove', targetPoint: i });
        }
      }
      return removable;
    }

    // Phase 1: Placing pieces
    if (state.phase === 'placing') {
      const places = [];
      for (let i = 0; i < 24; i++) {
        if (state.points[i] === null) {
          places.push({ action: 'place', point: i });
        }
      }
      return places;
    }

    // Phase 2: Moving pieces
    const moves = [];
    const isFlying = state.alivePieces[playerIndex] === 3;

    for (let i = 0; i < 24; i++) {
      if (state.points[i] === playerIndex) {
        if (isFlying) {
          // Can fly to ANY vacant point
          for (let j = 0; j < 24; j++) {
            if (state.points[j] === null) {
              moves.push({ action: 'move', from: i, to: j });
            }
          }
        } else {
          // Can only move to adjacent empty points
          const neighbors = NineMensMorrisGame.ADJACENCY[i] || [];
          for (const n of neighbors) {
            if (state.points[n] === null) {
              moves.push({ action: 'move', from: i, to: n });
            }
          }
        }
      }
    }

    return moves;
  }

  _isPartOfMill(points, pointIdx, color) {
    return NineMensMorrisGame.MILLS.some(mill => 
      mill.includes(pointIdx) && mill.every(p => points[p] === color)
    );
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const nextState = this.cloneState(state);
    const opp = 1 - playerIndex;

    if (move.action === 'remove') {
      if (nextState.points[move.targetPoint] !== opp) {
        return { nextState: state, valid: false, error: 'Không thể bắt quân này' };
      }
      nextState.points[move.targetPoint] = null;
      nextState.alivePieces[opp]--;
      nextState.mustRemoveOpponent = false;

      // Check win condition (opponent reduced to 2 pieces in moving phase)
      if (nextState.phase === 'moving' && nextState.alivePieces[opp] < 3) {
        nextState.gameOver = true;
        nextState.winner = playerIndex;
        return {
          nextState,
          valid: true,
          result: {
            over: true,
            winner: playerIndex,
            reason: `Chiến thắng! Đối thủ chỉ còn ${nextState.alivePieces[opp]} quân cờ!`
          }
        };
      }

      nextState.turn = opp;
      return { nextState, valid: true };
    }

    if (move.action === 'place') {
      nextState.points[move.point] = playerIndex;
      nextState.placedPieces[playerIndex]++;

      // Check if placed stone formed a mill
      if (this._isPartOfMill(nextState.points, move.point, playerIndex)) {
        nextState.mustRemoveOpponent = true;
        return { nextState, valid: true, formedMill: true };
      }

      // Check if placement phase ends (both placed 9 pieces)
      if (nextState.placedPieces[0] >= 9 && nextState.placedPieces[1] >= 9) {
        nextState.phase = 'moving';
      }

      nextState.turn = opp;
      return { nextState, valid: true };
    }

    if (move.action === 'move') {
      nextState.points[move.from] = null;
      nextState.points[move.to] = playerIndex;

      // Check if move formed a mill
      if (this._isPartOfMill(nextState.points, move.to, playerIndex)) {
        nextState.mustRemoveOpponent = true;
        return { nextState, valid: true, formedMill: true };
      }

      nextState.turn = opp;
      return { nextState, valid: true };
    }

    return { nextState: state, valid: false, error: 'Hành động không hợp lệ' };
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) return null;

    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Prioritize moves forming mills
    for (const m of validMoves) {
      if (m.action === 'place' && this._isPartOfMill(state.points, m.point, playerIndex)) {
        return m;
      }
    }

    return validMoves[0];
  }

  formatMove(move) {
    if (move.action === 'remove') return `Bắt quân tại điểm ${move.targetPoint + 1}`;
    if (move.action === 'place') return `Đặt tại điểm ${move.point + 1}`;
    return `Điểm ${move.from + 1} ➔ Điểm ${move.to + 1}`;
  }
}
