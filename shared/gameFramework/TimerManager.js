/**
 * TimerManager - Controls game clock, blitz/rapid/classical, increments, and flag timeouts
 */
export class TimerManager {
  /**
   * Create clock configuration
   * @param {number} initialSeconds - e.g. 180 (3 min), 600 (10 min)
   * @param {number} incrementSeconds - e.g. 2 for 3+2 blitz
   * @param {number} playerCount - default 2
   */
  static createInitialClocks(initialSeconds = 600, incrementSeconds = 0, playerCount = 2) {
    const times = {};
    for (let i = 0; i < playerCount; i++) {
      times[i] = initialSeconds;
    }
    return {
      initialSeconds,
      incrementSeconds,
      times,
      activePlayer: 0,
      lastTick: Date.now(),
      running: false
    };
  }

  /**
   * Switches turn and applies increment
   */
  static switchTurn(timerState, nextPlayer) {
    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - timerState.lastTick) / 1000));
    
    // Deduct elapsed time from active player
    timerState.times[timerState.activePlayer] = Math.max(
      0,
      timerState.times[timerState.activePlayer] - elapsed + timerState.incrementSeconds
    );
    
    timerState.activePlayer = nextPlayer;
    timerState.lastTick = now;
    timerState.running = true;
    return timerState;
  }

  /**
   * Checks if active player has run out of time
   */
  static checkTimeout(timerState) {
    if (!timerState.running) return null;
    const now = Date.now();
    const elapsed = Math.floor((now - timerState.lastTick) / 1000);
    const currentRemaining = timerState.times[timerState.activePlayer] - elapsed;
    if (currentRemaining <= 0) {
      return {
        timedOutPlayer: timerState.activePlayer,
        winner: 1 - timerState.activePlayer
      };
    }
    return null;
  }
}
