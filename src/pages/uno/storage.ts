import { ScopedStorage } from '@/shell/storage';
import { PlayerDefinition, RoundResult } from './models';

function verifyPlayerDefs(players: PlayerDefinition[]): void {
  if (players.length < 2) {
    throw Error('At least two players are required');
  }

  const seenIds: string[] = [];
  for (const playerDef of players) {
    if (typeof playerDef.id !== 'string') {
      throw TypeError('Player id must be string');
    }
    if (typeof playerDef.name !== 'string') {
      throw TypeError('Player name must be string');
    }

    if (!playerDef.id || playerDef.id.length === 0) {
      throw Error('Player id is required');
    }
    if (playerDef.id.length > 1) {
      throw Error('Player id must be one character');
    }

    if (!playerDef.name || playerDef.name.length === 0) {
      throw Error('Player name is required');
    }

    if (seenIds.includes(playerDef.id)) {
      throw Error(`Duplicated player id: ${playerDef.id}`);
    }
    seenIds.push(playerDef.id);
  }
}

function verifyRounds(rounds: RoundResult[]): void {
  let i = 1;
  for (const round of rounds) {
    if (typeof round.id !== 'number') {
      throw TypeError('round id must be numeric');
    }
    if (typeof round.winner !== 'string') {
      throw TypeError('round winner must be string');
    }

    if (round.id !== i) {
      throw Error('Out of order round record');
    }

    if (!round.winner || round.winner.length === 0) {
      throw Error('Round record does not have any winner');
    }
    if (round.winner.length > 1) {
      throw Error('Invalid winner id');
    }

    // we dont check if the winner is actually exists as players may be updated mid-game

    for (const score of round.scores) {
      if (typeof score.playerId !== 'string') {
        throw TypeError("Score's player id must be string");
      }
      if (typeof score.score !== 'number') {
        throw TypeError('Player score must be numeric');
      }

      if (!score.playerId || score.playerId.length === 0) {
        throw Error('Score record does not belong to any players');
      }
      if (score.playerId.length > 1) {
        throw Error('Invalid score record player id');
      }

      if (score.score < 0) {
        throw Error("Player score can't be negative");
      }
    }

    i++;
  }
}

export function storeRound(round: RoundResult): void {
  const rounds = unoStorage.get('roundResults');
  rounds.push(round);

  unoStorage.set('roundResults', rounds);
}

export function removeLastRound(): void {
  const rounds = unoStorage.get('roundResults');
  rounds.pop();

  unoStorage.set('roundResults', rounds);
}

export interface UnoState {
  endScore: number;
  playerDefs: PlayerDefinition[];
  roundResults: RoundResult[];
}

export const unoStorage = new ScopedStorage<UnoState>({
  id: 'uno',
  storage: localStorage,
  defaultValue: {
    endScore: 300,
    playerDefs: [
      {
        id: 'S',
        name: 'Saeed',
      },
      {
        id: 'M',
        name: 'Masoumeh',
      },
      {
        id: 'A',
        name: 'Alireza',
      },
    ],
    roundResults: [],
  },
  validator: (key, value): boolean => {
    switch (key) {
      case 'playerDefs': {
        verifyPlayerDefs(value as PlayerDefinition[]);
        return true;
      }
      case 'roundResults': {
        verifyRounds(value as RoundResult[]);
        return true;
      }
      case 'endScore': {
        return !Number.isNaN(value);
      }
    }
  },
});
