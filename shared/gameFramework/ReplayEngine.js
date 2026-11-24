/**
 * ReplayEngine - Records and navigates move history for post-game analysis and spectating
 */
export class ReplayEngine {
  constructor(gameId, metadata = {}) {
    this.gameId = gameId;
    this.metadata = {
      startedAt: Date.now(),
      players: metadata.players || [],
      timeControl: metadata.timeControl || '10+0',
      ...metadata
    };
    this.history = []; // Array of { ply, playerIndex, move, notation, timestamp, stateSnapshot }
  }

  recordMove(playerIndex, move, notation, stateSnapshot) {
    const ply = this.history.length + 1;
    this.history.push({
      ply,
      playerIndex,
      move,
      notation,
      timestamp: Date.now(),
      stateSnapshot: JSON.parse(JSON.stringify(stateSnapshot))
    });
  }

  getSnapshotAtPly(targetPly) {
    if (targetPly <= 0) return null;
    const entry = this.history[targetPly - 1];
    return entry ? entry.stateSnapshot : null;
  }

  exportJson() {
    return JSON.stringify({
      gameId: this.gameId,
      metadata: this.metadata,
      totalMoves: this.history.length,
      history: this.history
    }, null, 2);
  }

  static fromJson(jsonStr) {
    const data = JSON.parse(jsonStr);
    const replay = new ReplayEngine(data.gameId, data.metadata);
    replay.history = data.history;
    return replay;
  }
}
