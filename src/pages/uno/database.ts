import { getLocalItem, StorageCategory, setLocalItem } from '../../shell/utils';
import type { PlayerDefinition, RoundResult } from './models';

const defaultPlayerDefs: PlayerDefinition[] = [
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
];

export function getDefaultPlayerDefs(): PlayerDefinition[] {
  return defaultPlayerDefs.slice();
}

export function verifyPlayerDefs(players: PlayerDefinition[]): void {
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

export function verifyRounds(rounds: RoundResult[]): void {
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

export function getPlayerDefs(): PlayerDefinition[] {
  const existingPlayers = getLocalItem(StorageCategory.Uno, 'players');
  let players: PlayerDefinition[];
  if (existingPlayers) {
    try {
      players = JSON.parse(existingPlayers);
      verifyPlayerDefs(players);
    } catch (e) {
      console.error(e);
      players = defaultPlayerDefs.slice();
    }
  } else {
    players = defaultPlayerDefs.slice();
  }
  return players;
}

export function addPlayerDef(player: PlayerDefinition): void {
  const players = getPlayerDefs();
  players.push(player);

  updatePlayerDefs(players);
}

export function removePlayerDef(player: PlayerDefinition): void {
  const players = getPlayerDefs().filter((item) => {
    return item.id !== player.id;
  });

  updatePlayerDefs(players);
}

export function resetPlayerDefs(): void {
  updatePlayerDefs(defaultPlayerDefs);
}

export function updatePlayerDefs(players: PlayerDefinition[]): void {
  verifyPlayerDefs(players);
  const data = JSON.stringify(players);
  setLocalItem(StorageCategory.Uno, 'players', data);
}

export function getRounds(): RoundResult[] {
  const existingRounds = getLocalItem(StorageCategory.Uno, 'rounds');
  let rounds: RoundResult[];
  if (existingRounds) {
    try {
      rounds = JSON.parse(existingRounds);
      verifyRounds(rounds);
    } catch (e) {
      console.error(e);
      rounds = [];
    }
  } else {
    rounds = [];
  }
  return rounds;
}

export function storeRound(round: RoundResult): void {
  const rounds = getRounds();
  rounds.push(round);

  updateRounds(rounds);
}

export function removeLastRound(): void {
  const rounds = getRounds();
  rounds.pop();

  updateRounds(rounds);
}

export function resetRounds(): void {
  updateRounds([]);
}

function updateRounds(rounds: RoundResult[]): void {
  verifyRounds(rounds);
  const data = JSON.stringify(rounds);
  setLocalItem(StorageCategory.Uno, 'rounds', data);
}
