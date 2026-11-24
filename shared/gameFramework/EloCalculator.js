/**
 * FIDE-compliant Elo Rating Calculator
 * Calculates rating adjustments for individual games.
 */
export class EloCalculator {
  /**
   * Expected score of player A against player B
   * Ea = 1 / (1 + 10 ^ ((Rb - Ra) / 400))
   */
  static getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Determines K-factor based on match count or rating
   */
  static getKFactor(rating, gamesPlayed = 30) {
    if (gamesPlayed < 30) return 40; // Placement phase
    if (rating < 2400) return 20;
    return 10; // Master level
  }

  /**
   * Calculates new ratings after a match
   * @param {number} ratingA - Current rating of player A
   * @param {number} ratingB - Current rating of player B
   * @param {number} scoreA - 1 for win, 0.5 for draw, 0 for loss
   * @param {number} gamesPlayedA
   * @param {number} gamesPlayedB
   * @returns {{ newRatingA: number, newRatingB: number, deltaA: number, deltaB: number }}
   */
  static calculate(ratingA, ratingB, scoreA, gamesPlayedA = 30, gamesPlayedB = 30) {
    const expectedA = this.getExpectedScore(ratingA, ratingB);
    const expectedB = 1 - expectedA;
    const scoreB = 1 - scoreA;

    const kA = this.getKFactor(ratingA, gamesPlayedA);
    const kB = this.getKFactor(ratingB, gamesPlayedB);

    const deltaA = Math.round(kA * (scoreA - expectedA));
    const deltaB = Math.round(kB * (scoreB - expectedB));

    return {
      newRatingA: Math.max(100, ratingA + deltaA),
      newRatingB: Math.max(100, ratingB + deltaB),
      deltaA,
      deltaB
    };
  }
}
