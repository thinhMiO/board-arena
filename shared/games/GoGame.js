import { BaseGame } from '../gameFramework/BaseGame.js';

export class GoGame extends BaseGame {
  constructor() {
    super({
      id: 'go',
      name: 'Go (Weiqi / Baduk)',
      nameVi: 'Cờ Vây',
      category: 'strategy',
      description: 'Trò chơi bàn cờ cổ xưa và sâu sắc nhất. Vây đất, bắt quân, kiểm soát không gian rộng lớn.',
      rulesSummary: 'Luân phiên đặt quân Đen và Trắng vào các giao điểm. Quân hoặc nhóm quân hết khí (liberties) sẽ bị nhấc khỏi bàn. Tuân thủ luật Ko (không lặp lại trạng thái trước). Tính điểm theo đất và tù binh.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Circle',
      coverGradient: 'from-stone-700 to-zinc-950',
      variants: [
        { id: 'size_9', name: 'Bàn 9x9 (Học chơi)' },
        { id: 'size_13', name: 'Bàn 13x13 (Nhanh)' },
        { id: 'size_19', name: 'Bàn 19x19 (Tiêu chuẩn)' }
      ],
      defaultSettings: { size: 9, komi: 6.5 }
    });
  }

  init(options = {}) {
    const size = options.size || 9;
    const board = Array(size).fill(null).map(() => Array(size).fill(null));
    return {
      size,
      board,
      turn: 0, // 0: Black, 1: White
      prisoners: { black: 0, white: 0 },
      consecutivePasses: 0,
      koSquare: null,
      lastMove: null,
      gameOver: false,
      winner: null,
      territory: null,
      komi: options.komi || 6.5
    };
  }

  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    const validMoves = [{ isPass: true }];
    const color = playerIndex === 0 ? 'B' : 'W';

    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        if (state.board[r][c] === null) {
          if (state.koSquare && state.koSquare.r === r && state.koSquare.c === c) {
            continue; // Ko rule forbids
          }
          if (this._isValidStonePlacement(state, r, c, color)) {
            validMoves.push({ r, c, isPass: false });
          }
        }
      }
    }
    return validMoves;
  }

  _isValidStonePlacement(state, r, c, color) {
    const opp = color === 'B' ? 'W' : 'B';
    const testBoard = this.cloneState(state.board);
    testBoard[r][c] = color;

    // Check if move captures any opponent groups
    let captures = 0;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < state.size && nc >= 0 && nc < state.size && testBoard[nr][nc] === opp) {
        const group = this._findGroup(testBoard, nr, nc, opp, state.size);
        if (group.liberties.length === 0) {
          captures += group.stones.length;
        }
      }
    }
    if (captures > 0) return true;

    // If no captures, own group must have at least 1 liberty (no suicide)
    const ownGroup = this._findGroup(testBoard, r, c, color, state.size);
    return ownGroup.liberties.length > 0;
  }

  _findGroup(board, startR, startC, color, size) {
    const stones = [];
    const libertiesSet = new Set();
    const visited = Array(size).fill(false).map(() => Array(size).fill(false));
    const queue = [{ r: startR, c: startC }];
    visited[startR][startC] = true;

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      stones.push({ r, c });

      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (board[nr][nc] === null) {
            libertiesSet.add(`${nr},${nc}`);
          } else if (board[nr][nc] === color && !visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.push({ r: nr, c: nc });
          }
        }
      }
    }

    return { stones, liberties: Array.from(libertiesSet) };
  }

  makeMove(state, move, playerIndex) {
    if (state.gameOver) return { nextState: state, valid: false, error: 'Trận đấu đã kết thúc' };
    if (state.turn !== playerIndex) return { nextState: state, valid: false, error: 'Chưa đến lượt' };

    const nextState = this.cloneState(state);

    if (move.isPass) {
      nextState.consecutivePasses++;
      nextState.lastMove = { isPass: true, playerIndex };
      nextState.turn = 1 - playerIndex;

      // Two consecutive passes ends the game!
      if (nextState.consecutivePasses >= 2) {
        nextState.gameOver = true;
        // Territory count
        const score = this._scoreTerritory(nextState.board, nextState.size, nextState.prisoners, nextState.komi);
        nextState.winner = score.winner;
        nextState.territory = score;
        return {
          nextState,
          valid: true,
          result: {
            over: true,
            winner: score.winner,
            reason: `Trận đấu kết thúc qua 2 lần bỏ lượt! Đen: ${score.blackScore.toFixed(1)} - Trắng: ${score.whiteScore.toFixed(1)} (${score.winner === 0 ? 'Đen thắng' : 'Trắng thắng'})`
          }
        };
      }
      return { nextState, valid: true };
    }

    nextState.consecutivePasses = 0;
    const { r, c } = move;
    const color = playerIndex === 0 ? 'B' : 'W';
    const opp = color === 'B' ? 'W' : 'B';

    if (!this._isValidStonePlacement(nextState, r, c, color)) {
      return { nextState: state, valid: false, error: 'Nước đi tự sát (hết khí) hoặc không hợp lệ!' };
    }

    nextState.board[r][c] = color;
    let capturedStonesCount = 0;
    let singleCapPos = null;

    // Capture dead opponent stones
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < state.size && nc >= 0 && nc < state.size && nextState.board[nr][nc] === opp) {
        const group = this._findGroup(nextState.board, nr, nc, opp, state.size);
        if (group.liberties.length === 0) {
          group.stones.forEach(st => {
            nextState.board[st.r][st.c] = null;
            capturedStonesCount++;
            singleCapPos = st;
          });
        }
      }
    }

    if (playerIndex === 0) {
      nextState.prisoners.white += capturedStonesCount;
    } else {
      nextState.prisoners.black += capturedStonesCount;
    }

    // Set Ko rule if single stone captured and move had 1 liberty
    if (capturedStonesCount === 1) {
      const myGroup = this._findGroup(nextState.board, r, c, color, state.size);
      if (myGroup.liberties.length === 1) {
        nextState.koSquare = singleCapPos;
      } else {
        nextState.koSquare = null;
      }
    } else {
      nextState.koSquare = null;
    }

    nextState.lastMove = { r, c, color };
    nextState.turn = 1 - playerIndex;
    return { nextState, valid: true };
  }

  _scoreTerritory(board, size, prisoners, komi) {
    let blackTerritory = 0;
    let whiteTerritory = 0;
    const visited = Array(size).fill(false).map(() => Array(size).fill(false));

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === null && !visited[r][c]) {
          const region = [];
          const borders = new Set();
          const queue = [{ r, c }];
          visited[r][c] = true;

          while (queue.length > 0) {
            const curr = queue.shift();
            region.push(curr);

            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              const nr = curr.r + dr, nc = curr.c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (board[nr][nc] === null && !visited[nr][nc]) {
                  visited[nr][nc] = true;
                  queue.push({ r: nr, c: nc });
                } else if (board[nr][nc] !== null) {
                  borders.add(board[nr][nc]);
                }
              }
            }
          }

          if (borders.size === 1) {
            const owner = borders.values().next().value;
            if (owner === 'B') blackTerritory += region.length;
            else if (owner === 'W') whiteTerritory += region.length;
          }
        }
      }
    }

    const blackScore = blackTerritory + prisoners.white;
    const whiteScore = whiteTerritory + prisoners.black + komi;
    return {
      blackScore,
      whiteScore,
      winner: blackScore > whiteScore ? 0 : 1
    };
  }

  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    const nonPassMoves = validMoves.filter(m => !m.isPass);
    if (!nonPassMoves.length) return { isPass: true };

    if (difficulty === 'easy') {
      return nonPassMoves[Math.floor(Math.random() * nonPassMoves.length)];
    }

    // Prioritize 3-3, 4-4, star points and captures
    nonPassMoves.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      // Bonus for center or star points
      const mid = Math.floor(state.size / 2);
      if (a.r === mid && a.c === mid) scoreA += 50;
      if (b.r === mid && b.c === mid) scoreB += 50;
      return scoreB - scoreA;
    });

    return nonPassMoves[0];
  }

  formatMove(move) {
    if (move.isPass) return 'Bỏ lượt (Pass)';
    return `${String.fromCharCode(65 + move.c)}${move.r + 1}`;
  }
}
