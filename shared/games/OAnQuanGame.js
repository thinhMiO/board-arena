import { BaseGame } from '../gameFramework/BaseGame.js';

export class OAnQuanGame extends BaseGame {
  constructor() {
    super({
      id: 'o_an_quan',
      name: 'O An Quan',
      nameVi: 'Ô Ăn Quan',
      category: 'vietnamese',
      description: 'Trò chơi dân gian trí tuệ đậm đà bản sắc Việt Nam với bàn cờ 10 ô dân và 2 ô quan.',
      rulesSummary: '10 ô dân (mỗi ô 5 viên sỏi) và 2 ô quan hình bán nguyệt (mỗi quan 10 điểm). Chọn ô dân của mình, rải từng viên xuôi hoặc ngược chiều kim đồng hồ. Ăn ô có quân khi ô liền kề trống! Trò chơi kết thúc khi 2 quan bị ăn sạch.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Coins',
      coverGradient: 'from-amber-700 to-yellow-900',
      variants: [{ id: 'standard', name: 'Ô ăn quan truyền thống (5 ô/bên)' }],
      defaultSettings: {}
    });
  }

  init() {
    // Board representation:
    // Indices 0, 1, 2, 3, 4: Player 0's rice fields (bottom)
    // Index 5: Right Quan (Mandarin) - worth 10 points
    // Indices 6, 7, 8, 9, 10: Player 1's rice fields (top, ordered 6->10 or 10->6)
    // Index 11: Left Quan (Mandarin) - worth 10 points
    const cells = Array(12).fill(5);
    cells[5] = 10; // Right Quan
    cells[11] = 10; // Left Quan

    return {
      cells,
      scores: { 0: 0, 1: 0 },
      turn: 0, // 0: Player 0, 1: Player 1
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const myCells = playerIndex === 0 ? [0, 1, 2, 3, 4] : [6, 7, 8, 9, 10];
    const validMoves = [];

    // Check if player's cells are all empty (Cháy quân)
    const hasStones = myCells.some(idx => state.cells[idx] > 0);

    if (!hasStones) {
      // Must spread 5 stones from score into 5 fields
      return [{ action: 'reseed', playerIndex }];
    }

    for (const cellIdx of myCells) {
      if (state.cells[cellIdx] > 0) {
        // Both directions: +1 (clockwise/right) and -1 (counter-clockwise/left)
        validMoves.push({ cellIdx, direction: 1 });
        validMoves.push({ cellIdx, direction: -1 });
      }
    }
    return validMoves;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const nextState = this.cloneState(state);

    if (move.action === 'reseed') {
      const myCells = playerIndex === 0 ? [0, 1, 2, 3, 4] : [6, 7, 8, 9, 10];
      // Deduct 5 points from score, put 1 in each cell
      nextState.scores[playerIndex] -= 5;
      myCells.forEach(idx => { nextState.cells[idx] += 1; });
      return { nextState, valid: true };
    }

    const { cellIdx, direction } = move;
    let handStones = nextState.cells[cellIdx];
    nextState.cells[cellIdx] = 0;
    let currentIdx = cellIdx;

    // Simulation loop of sowing stones
    while (handStones > 0) {
      currentIdx = (currentIdx + direction + 12) % 12;
      nextState.cells[currentIdx]++;
      handStones--;

      // When last stone is dropped
      if (handStones === 0) {
        // Look at next square
        let nextIdx = (currentIdx + direction + 12) % 12;

        // If next is a Quan or has stones, continue
        if (nextIdx === 5 || nextIdx === 11) {
          // Stop at Quan
          break;
        } else if (nextState.cells[nextIdx] > 0) {
          // Pick up stones from next square and continue sowing
          handStones = nextState.cells[nextIdx];
          nextState.cells[nextIdx] = 0;
          currentIdx = nextIdx;
        } else {
          // Next square is EMPTY: Check for Capture ("Ăn")
          while (true) {
            const captureTargetIdx = (nextIdx + direction + 12) % 12;
            if (nextState.cells[nextIdx] === 0 && nextState.cells[captureTargetIdx] > 0) {
              // Captured!
              const eatenStones = nextState.cells[captureTargetIdx];
              nextState.cells[captureTargetIdx] = 0;
              nextState.scores[playerIndex] += eatenStones;

              // Check if subsequent square is empty to chain capture
              nextIdx = (captureTargetIdx + direction + 12) % 12;
              if (nextState.cells[nextIdx] !== 0) {
                break;
              }
            } else {
              break;
            }
          }
          break;
        }
      }
    }

    nextState.lastMove = move;
    nextState.turn = 1 - playerIndex;

    // Check Game Over: Both Quans are eaten (both cell 5 and 11 have 0 stones)
    if (nextState.cells[5] === 0 && nextState.cells[11] === 0) {
      // Gather remaining stones in own fields to score
      for (let i = 0; i <= 4; i++) {
        nextState.scores[0] += nextState.cells[i];
        nextState.cells[i] = 0;
      }
      for (let i = 6; i <= 10; i++) {
        nextState.scores[1] += nextState.cells[i];
        nextState.cells[i] = 0;
      }

      nextState.gameOver = true;
      if (nextState.scores[0] > nextState.scores[1]) {
        nextState.winner = 0;
      } else if (nextState.scores[1] > nextState.scores[0]) {
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
          reason: `Hết quan, tàn dân! Điểm Người 1: ${nextState.scores[0]} - Điểm Người 2: ${nextState.scores[1]}. ${nextState.winner !== null ? `Người chơi ${nextState.winner + 1} thắng!` : 'Hòa!'}`
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

    // Pick move that yields highest score gain
    let bestMove = validMoves[0];
    let maxScoreGain = -Infinity;

    for (const m of validMoves) {
      if (m.action === 'reseed') return m;
      const sim = this.makeMove(state, m, playerIndex);
      if (sim.valid) {
        const gain = sim.nextState.scores[playerIndex] - state.scores[playerIndex];
        if (gain > maxScoreGain) {
          maxScoreGain = gain;
          bestMove = m;
        }
      }
    }

    return bestMove;
  }

  formatMove(move) {
    if (move.action === 'reseed') return 'Rải quân vào 5 ô';
    return `Ô ${move.cellIdx + 1} (${move.direction === 1 ? 'Thuận' : 'Nghịch'})`;
  }
}
