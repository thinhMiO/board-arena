/**
 * GameRegistry - Central discovery and registration system for all Board Arena games.
 * Adding a new board game to the system only requires registering it here!
 */
class GameRegistrySingleton {
  constructor() {
    this.games = new Map();
  }

  /**
   * Register a new game engine
   * @param {import('./BaseGame').BaseGame} gameInstance
   */
  register(gameInstance) {
    if (!gameInstance || !gameInstance.id) {
      throw new Error('Game must have a valid instance and ID');
    }
    this.games.set(gameInstance.id, gameInstance);
    console.log(`[GameRegistry] Registered game: ${gameInstance.nameVi} (${gameInstance.id})`);
  }

  /**
   * Retrieve game by ID
   * @param {string} id
   * @returns {import('./BaseGame').BaseGame|undefined}
   */
  get(id) {
    return this.games.get(id);
  }

  /**
   * Check if game exists
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this.games.has(id);
  }

  /**
   * Get all registered games as array of metadata
   */
  getAll() {
    return Array.from(this.games.values());
  }

  /**
   * Get simplified list for lobby and client display
   */
  getMetadataList() {
    return Array.from(this.games.values()).map(g => ({
      id: g.id,
      name: g.name,
      nameVi: g.nameVi,
      category: g.category,
      description: g.description,
      rulesSummary: g.rulesSummary,
      minPlayers: g.minPlayers,
      maxPlayers: g.maxPlayers,
      variants: g.variants,
      icon: g.icon,
      coverGradient: g.coverGradient,
      defaultSettings: g.defaultSettings
    }));
  }
}

export const GameRegistry = new GameRegistrySingleton();
