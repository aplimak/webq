export class Player {
  id: string;
  name: string;
  score: number;
  wins: number;
  averageScore: number;
  _processedRounds: number[];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.wins = 0;
    this.averageScore = 0;

    this._processedRounds = [];
  }

  applyRound(round: RoundResult) {
    if (this._processedRounds.includes(round.id)) {
      // Already applied
      return;
    }

    const playerScore = round.scores.find((s) => s.playerId === this.id);
    if (playerScore) {
      this.score += playerScore.score;

      this._processedRounds.push(round.id);
    }

    if (this._processedRounds.length > 0) {
      this.averageScore += Math.round(this.score / this._processedRounds.length);
    } else {
      this.averageScore = 0;
    }

    if (round.winner === this.id) {
      this.wins += 1;
    }
  }
}

export interface PlayerDefinition {
  id: string;
  name: string;
}

export interface PlayerSortingResult {
  players: Player[];
  winsUsed: boolean;
  averageScoreUsed: boolean;
}

export interface RoundScore {
  playerId: string;
  score: number;
}

export interface RoundResult {
  id: number;
  scores: RoundScore[];
  winner: string;
}

export interface RoundData {
  id: number;
  shufflingTurn: Player;
  result?: RoundResult;
}

export interface GameStatistics {
  topPlayer: Player;
  lastPlayer: Player;
  highestScore: number;
  gameEnded: boolean;
  sortResult: PlayerSortingResult;
}
