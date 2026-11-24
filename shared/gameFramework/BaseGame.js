/**
 * BaseGame - Abstract class defining standard Game Engine lifecycle
 * Every board game in BOARD ARENA implements this interface.
 */
export class BaseGame {
  constructor(metadata) {
    this.id = metadata.id;
    this.name = metadata.name;
    this.nameVi = metadata.nameVi;
    this.category = metadata.category || 'strategy';
    this.description = metadata.description || '';
    this.rulesSummary = metadata.rulesSummary || '';
    this.minPlayers = metadata.minPlayers || 2;
    this.maxPlayers = metadata.maxPlayers || 2;
    this.variants = metadata.variants || [];
    this.defaultSettings = metadata.defaultSettings || {};
    this.icon = metadata.icon || 'Gamepad2';
    this.coverGradient = metadata.coverGradient || 'from-blue-600 to-indigo-900';
  }

  /**
   * Initializes a new game state.
   * @param {Object} options custom settings, board size, variant, etc.
   * @returns {Object} initial state
   */
  init(options = {}) {
    throw new Error(`Game [${this.id}] init() not implemented`);
  }

  /**
   * Returns a list of legal moves for the current player.
   * @param {Object} state
   * @param {number} playerIndex
   * @returns {Array<any>} list of moves
   */
  getValidMoves(state, playerIndex) {
    throw new Error(`Game [${this.id}] getValidMoves() not implemented`);
  }

  /**
   * Validates and applies a move to the state.
   * @param {Object} state
   * @param {any} move
   * @param {number} playerIndex
   * @returns {{ nextState: Object, valid: boolean, error?: string, result?: { over: boolean, winner: number|null, reason: string } }}
   */
  makeMove(state, move, playerIndex) {
    throw new Error(`Game [${this.id}] makeMove() not implemented`);
  }

  /**
   * Evaluates end of game conditions.
   * @param {Object} state
   * @returns {{ over: boolean, winner: number|null, reason: string }|null}
   */
  checkGameOver(state) {
    return null;
  }

  /**
   * AI move generator for a given difficulty level.
   * @param {Object} state
   * @param {number} playerIndex
   * @param {'easy'|'medium'|'hard'|'master'} difficulty
   * @returns {any} chosen move
   */
  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    if (!validMoves || validMoves.length === 0) return null;
    // Default fallback: random move
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  /**
   * Formats a move into human-readable notation (e.g. "e4", "P2-3", "A5").
   * @param {any} move
   * @param {Object} state
   * @returns {string}
   */
  formatMove(move, state) {
    return JSON.stringify(move);
  }

  /**
   * Returns a clone/deep copy of game state.
   * @param {Object} state
   * @returns {Object}
   */
  cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }
}
