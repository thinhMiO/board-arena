import { BaseGame } from '../gameFramework/BaseGame.js';

// 52 Perimeter Track Squares in Clockwise Order (15x15 Grid coordinates [row, col])
export const TRACK_COORDS = [
  // Left arm top going right (0 - 4)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top arm left going up (5 - 10)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top edge (11)
  [0, 7],
  // Top arm right going down (12 - 17)
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Right arm top going right (18 - 23)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right edge (24)
  [7, 14],
  // Right arm bottom going left (25 - 30)
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Bottom arm right going down (31 - 36)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom edge (37)
  [14, 7],
  // Bottom arm left going up (38 - 43)
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Left arm bottom going left (44 - 49)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left edge (50 - 51)
  [7, 0], [6, 0]
];

// Start Gate index for each player color
export const START_GATES = {
  0: 0,  // Red: track index 0 ([6, 1])
  1: 26, // Yellow (or Blue in 4p): track index 26 ([8, 13])
  2: 13, // Blue: track index 13 ([1, 8])
  3: 39  // Green: track index 39 ([13, 6])
};

// Home Barn columns (slots 1 to 6)
export const BARN_COORDS = {
  0: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]], // Red (left to center)
  1: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]], // Yellow (right to center)
  2: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]], // Blue (top to center)
  3: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]] // Green (bottom to center)
};

// Stables 4 horse positions [row, col]
export const STABLE_COORDS = {
  0: [[2, 2], [2, 3], [3, 2], [3, 3]], // Red (Top-Left)
  1: [[11, 11], [11, 12], [12, 11], [12, 12]], // Yellow (Bottom-Right)
  2: [[2, 11], [2, 12], [3, 11], [3, 12]], // Blue (Top-Right)
  3: [[11, 2], [11, 3], [12, 2], [12, 3]] // Green (Bottom-Left)
};

export class CoCaNguaGame extends BaseGame {
  constructor() {
    super({
      id: 'co_ca_ngua',
      name: 'Co Ca Ngua (Ludo)',
      nameVi: 'Cờ Cá Ngựa',
      category: 'casual',
      description: 'Trò chơi đua ngựa dân gian kinh điển đầy kịch tính. Bàn cờ 15x15 chuẩn chữ thập: lắc xúc xắc, xuất chuồng, phi nước đại, đá ngựa đối phương và về đích 1-6.',
      rulesSummary: 'Gieo xúc xắc được 1 hoặc 6 để xuất quân ra đường đua. Di chuyển ngựa theo chiều kim đồng hồ. Đá ngựa đối phương về chuồng khi đáp cùng ô. Đi đủ 1 vòng quay về nhánh mình và leo lên bậc chuồng 1, 2, 3, 4, 5, 6.',
      minPlayers: 2,
      maxPlayers: 4,
      icon: 'Award',
      coverGradient: 'from-sky-700 to-blue-950',
      variants: [
        { id: 'mode_2p', name: 'Đấu 2 người (Đỏ vs Vàng đối xứng)' },
        { id: 'mode_4p', name: 'Đấu 4 người (Đầy đủ)' }
      ],
      defaultSettings: { players: 2 }
    });
  }

  init(options = {}) {
    const numPlayers = options.players || 2;
    // Each horse: id (0-3), step (-1: in stable, 0: at start gate, 1-50: on track, 51-56: in home barn slots 1-6)
    const horses = {};
    for (let p = 0; p < numPlayers; p++) {
      horses[p] = [
        { id: 0, step: -1 },
        { id: 1, step: -1 },
        { id: 2, step: -1 },
        { id: 3, step: -1 }
      ];
    }

    return {
      numPlayers,
      horses,
      turn: 0,
      dice: null,
      hasRolled: false,
      extraTurn: false,
      lastKickedHorse: null,
      gameOver: false,
      winner: null,
      lastMove: null
    };
  }

  // Get physical grid position [row, col] of a horse
  getHorseGridPos(horse, playerIndex) {
    if (horse.step === -1) {
      return STABLE_COORDS[playerIndex][horse.id];
    }
    if (horse.step >= 0 && horse.step <= 50) {
      const startGate = START_GATES[playerIndex];
      const trackIdx = (startGate + horse.step) % TRACK_COORDS.length;
      return TRACK_COORDS[trackIdx];
    }
    if (horse.step >= 51 && horse.step <= 56) {
      const slot = horse.step - 51; // 0 to 5
      return BARN_COORDS[playerIndex][slot];
    }
    return [7, 7]; // Center
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex || !state.hasRolled || !state.dice) return [];
    const dice = state.dice;
    const moves = [];
    const myHorses = state.horses[playerIndex];
    const startGate = START_GATES[playerIndex];

    myHorses.forEach((horse, hIdx) => {
      // 1. Can deploy from stable?
      if (horse.step === -1 && (dice === 1 || dice === 6)) {
        // Check if start gate is occupied by own horse
        const isOwnHorseAtStart = myHorses.some(h => h.id !== horse.id && h.step === 0);
        if (!isOwnHorseAtStart) {
          moves.push({ horseIndex: hIdx, type: 'deploy' });
        }
      }

      // 2. Can move along track?
      if (horse.step >= 0 && horse.step <= 50) {
        const nextStep = horse.step + dice;

        // Check if entering barn
        if (nextStep > 50) {
          const barnSlot = nextStep - 50; // 1 to 6
          if (barnSlot <= 6) {
            // Check if slot in barn is occupied by own horse
            const isOwnHorseInSlot = myHorses.some(h => h.id !== horse.id && h.step === 50 + barnSlot);
            if (!isOwnHorseInSlot) {
              moves.push({ horseIndex: hIdx, type: 'enter_barn', step: 50 + barnSlot, slot: barnSlot });
            }
          }
        } else {
          // Normal track move
          const nextTrackIdx = (startGate + nextStep) % TRACK_COORDS.length;
          // Check if own horse is already on that track square
          const isOwnHorseThere = myHorses.some(h => {
            if (h.id === horse.id || h.step < 0 || h.step > 50) return false;
            return ((startGate + h.step) % TRACK_COORDS.length) === nextTrackIdx;
          });

          if (!isOwnHorseThere) {
            moves.push({ horseIndex: hIdx, type: 'advance', step: nextStep });
          }
        }
      }

      // 3. Can step up in barn?
      if (horse.step >= 51 && horse.step <= 55) {
        const currentSlot = horse.step - 50; // 1 to 5
        // Can step up by dice or exactly 1 step
        if (currentSlot + dice <= 6) {
          const targetSlot = currentSlot + dice;
          const isOwnInTarget = myHorses.some(h => h.id !== horse.id && h.step === 50 + targetSlot);
          if (!isOwnInTarget) {
            moves.push({ horseIndex: hIdx, type: 'barn_step', step: 50 + targetSlot, slot: targetSlot });
          }
        }
      }
    });

    return moves;
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const nextState = this.cloneState(state);

    // Roll action
    if (move.action === 'roll') {
      if (nextState.hasRolled) return { nextState: state, valid: false, error: 'Bạn đã đổ xúc xắc rồi!' };
      const rolledDice = move.dice || (Math.floor(Math.random() * 6) + 1);
      nextState.dice = rolledDice;
      nextState.hasRolled = true;
      nextState.extraTurn = (rolledDice === 6);

      // Check if player has any valid moves
      const valid = this.getValidMoves(nextState, playerIndex);
      if (valid.length === 0) {
        // No moves available! Pass turn unless rolled 6
        if (rolledDice !== 6) {
          nextState.turn = (playerIndex + 1) % nextState.numPlayers;
        }
        nextState.hasRolled = false;
        nextState.dice = null;
        return { nextState, valid: true, pass: true, reason: `Đổ được ${rolledDice} nhưng không có nước đi hợp lệ` };
      }

      return { nextState, valid: true };
    }

    // Horse movement
    const horse = nextState.horses[playerIndex][move.horseIndex];
    if (!horse) return { nextState: state, valid: false, error: 'Quân ngựa không tồn tại' };

    const startGate = START_GATES[playerIndex];
    let kickedOpponent = null;

    if (move.type === 'deploy') {
      horse.step = 0; // At start gate
      // Check if kicking opponent at start gate
      kickedOpponent = this._kickOpponentAtTrack(nextState, startGate, playerIndex);
    } else if (move.type === 'advance') {
      horse.step = move.step;
      const trackIdx = (startGate + horse.step) % TRACK_COORDS.length;
      kickedOpponent = this._kickOpponentAtTrack(nextState, trackIdx, playerIndex);
    } else if (move.type === 'enter_barn' || move.type === 'barn_step') {
      horse.step = move.step;
    }

    nextState.lastKickedHorse = kickedOpponent;
    nextState.lastMove = move;

    // Check Win Condition: 2 horses in barn slots 5 or 6 (or 4 horses in barn)
    const inTopBarn = nextState.horses[playerIndex].filter(h => h.step >= 54);
    if (inTopBarn.length >= 2) {
      nextState.gameOver = true;
      nextState.winner = playerIndex;
      return {
        nextState,
        valid: true,
        result: {
          over: true,
          winner: playerIndex,
          reason: `Chiến thắng vang dội! Người chơi ${playerIndex === 0 ? 'Đỏ' : 'Vàng'} đã đưa các chú ngựa về đích!`
        }
      };
    }

    // Switch turn unless extra turn from rolling 6
    if (!nextState.extraTurn) {
      nextState.turn = (playerIndex + 1) % nextState.numPlayers;
    }
    nextState.hasRolled = false;
    nextState.dice = null;
    nextState.extraTurn = false;

    return { nextState, valid: true, kicked: !!kickedOpponent };
  }

  _kickOpponentAtTrack(state, trackIdx, myPlayerIndex) {
    for (let p = 0; p < state.numPlayers; p++) {
      if (p !== myPlayerIndex) {
        const oppStartGate = START_GATES[p];
        for (const h of state.horses[p]) {
          if (h.step >= 0 && h.step <= 50) {
            const oppTrackIdx = (oppStartGate + h.step) % TRACK_COORDS.length;
            if (oppTrackIdx === trackIdx) {
              // KICK! Send back to stable
              h.step = -1;
              return { player: p, horseId: h.id };
            }
          }
        }
      }
    }
    return null;
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    if (!state.hasRolled) {
      return { action: 'roll' };
    }
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves.length) {
      return null;
    }

    // Prioritize kicking opponent, then entering barn, then deploy, then farthest advance
    for (const m of validMoves) {
      const sim = this.makeMove(state, m, playerIndex);
      if (sim.valid && sim.kicked) return m; // Great kick!
    }

    for (const m of validMoves) {
      if (m.type === 'enter_barn' || m.type === 'barn_step') return m;
    }

    for (const m of validMoves) {
      if (m.type === 'deploy') return m;
    }

    return validMoves[0];
  }

  formatMove(move) {
    if (move.action === 'roll') return `Đổ xúc xắc ${move.dice}`;
    if (move.type === 'deploy') return `Xuất chuồng ngựa ${move.horseIndex + 1}`;
    if (move.type === 'advance') return `Ngựa ${move.horseIndex + 1} tiến lên bước ${move.step}`;
    return `Ngựa ${move.horseIndex + 1} vào bậc chuồng ${move.slot}`;
  }
}
