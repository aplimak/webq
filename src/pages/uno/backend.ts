import { getPlayerDefs, getRounds, resetRounds, storeRound } from './database';
import {
  type GameStatistics,
  Player,
  type PlayerSortingResult,
  type RoundData,
  type RoundResult,
} from './models';

export const players: Player[] = [];
export const rounds: RoundResult[] = [];

export let currentRound: RoundData | null = null;
export let lastRound: RoundData | null = null;

function definePlayers() {
  const playerDefs = getPlayerDefs();
  for (const def of playerDefs) {
    players.push(new Player(def.id, def.name));
  }
}

export function resetGame(sync = true) {
  players.length = 0;
  rounds.length = 0;

  currentRound = null;
  lastRound = null;

  if (sync) {
    resetRounds();
  }

  definePlayers();
  newRound();
}

export function newRound(result?: RoundResult, sync = true) {
  if (rounds.length > 0 && !result) {
    throw Error('Ending a round requires providing round result');
  }

  if (result) {
    if (!currentRound) {
      throw Error('There is no ongoing round to end');
    }

    const nextRoundId = currentRound.id + 1;
    const nextShufflerId = (players.indexOf(currentRound.shufflingTurn) + 1) % players.length;
    const nextShuffler = players[nextShufflerId];
    if (!nextShuffler) {
      throw Error('Shuffler index out of range');
    }

    if (sync) {
      // it checks the result before actually saving it
      storeRound(result);
    }

    currentRound.result = result;

    for (const player of players) {
      player.applyRound(result);
    }

    rounds.push(result);

    lastRound = currentRound;
    currentRound = {
      id: nextRoundId,
      shufflingTurn: nextShuffler,
    };
  } else {
    const shuffler = players[0];
    if (!shuffler) {
      throw Error('There is no player defined');
    }

    currentRound = {
      id: 1,
      shufflingTurn: shuffler,
    };
    lastRound = null;
  }
}

export function getStatistics(maxScore: number): GameStatistics {
  const sortResult = getSortedPlayers();
  const sortedPlayers = sortResult.players;
  const topPlayer = sortedPlayers[0];
  if (!topPlayer) {
    throw Error('Empty players list');
  }
  const lastPlayer = sortedPlayers[sortedPlayers.length - 1];
  if (!lastPlayer) {
    // of course if list empty the previous check will trigger and there is no way (unless an alien js bug) to get here...
    throw Error('Suspicious player list');
  }
  const highestScore = lastPlayer.score;

  return {
    topPlayer: topPlayer,
    lastPlayer: lastPlayer,
    highestScore: highestScore,
    gameEnded: highestScore >= maxScore,
    sortResult: sortResult,
  };
}

export function getSortedPlayers(): PlayerSortingResult {
  let winsUsed = false;
  let averageScoreUsed = false;

  const copiedPlayers = players.slice();

  if (rounds.length > 0) {
    copiedPlayers.sort((a, b) => {
      const scoreComparison = a.score - b.score;
      if (scoreComparison !== 0) {
        return scoreComparison;
      } else {
        winsUsed = true;
        const winsComparison = b.wins - a.wins;
        if (winsComparison !== 0) {
          return winsComparison;
        } else {
          //Sort by average score
          averageScoreUsed = true;
          const averageComparison = a.averageScore - b.averageScore;
          return averageComparison;
        }
      }
    });
  }

  return {
    players: copiedPlayers,
    winsUsed: winsUsed,
    averageScoreUsed: averageScoreUsed,
  };
}

export function restoreRounds() {
  resetGame(false);

  const pastRounds = getRounds();
  if (pastRounds) {
    for (const round of pastRounds) {
      newRound(round, false);
    }
  }
}

export default function () {
  restoreRounds();
}
