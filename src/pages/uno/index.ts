import {
  getLocalItem,
  StorageCategory,
  setupInputNavigation,
  showErrorToast,
  showSuccessToast,
  scrollToBottom,
} from '@shell/utils';

import main from './main.html';
import { Page } from '@shell/page';
import './style.css';

import * as backend from './backend';
import * as database from './database';
import type { RoundResult, RoundScore } from './models';

export let endScore = 300;

function drawTable(table: Element): void {
  let html = `
    <thead>
        <tr class="fixed-header">
            <th style="width: 1em;">#</th>`;

  for (const player of backend.players) {
    html += `<th style="width: 3em;max-width: 5em;">${player.id}</th>`;
  }
  html += `
        </tr>
    </thead>
    <tbody></tbody>`;
  table.innerHTML = html;
}

function addRoundToTable(table: Element, round: RoundResult): void {
  const body = table.querySelector('tbody');
  if (body) {
    const row = document.createElement('tr');
    let html = `<td>${round.id}</td>`;

    const scoreMap: Record<string, number> = {};
    for (const score of round.scores) {
      scoreMap[score.playerId] = score.score;
    }

    for (const player of backend.players) {
      const score = scoreMap[player.id];
      const hasScore = score !== undefined;
      let cls: string = '';
      if (!hasScore) {
        cls += 'red';
      } else if (round.winner === player.id) {
        cls = 'green';
      }
      html += `<td class="${cls}">${hasScore ? score : '0'}</td>`;
    }

    row.innerHTML = html;
    body.appendChild(row);

    const wrapper = table.closest('#uno-rounds-wrapper');
    scrollToBottom(wrapper!);
  }
}

function fixPlayersContainerOverflow(playersContainer: Element): void {
  const containerWidth = (playersContainer as HTMLDivElement).offsetWidth;
  const scrollWidth = (playersContainer as HTMLDivElement).scrollWidth;

  if (scrollWidth > containerWidth) {
    playersContainer.classList.remove('middle');
  } else {
    playersContainer.classList.add('middle');
  }
}

function handleNewRound(content: Element, newRoundBtn: Element): void {
  const playerCards = content.querySelectorAll<HTMLDivElement>('.uno-player-card');
  let focused = false;
  for (const card of playerCards) {
    const scoreInput = card.querySelector<HTMLInputElement>('#round-score');
    if (scoreInput) {
      scoreInput.classList.remove('hide');
      if (!focused) {
        scoreInput.focus();
        focused = true;
      }
    }
  }

  newRoundBtn.classList.add('uno-apply');
  const cancelBtn = content.querySelector('#cancel');
  if (cancelBtn) {
    cancelBtn.classList.remove('hide');
  }

  const playersContainer = content.querySelector('#uno-players');
  if (playersContainer) {
    fixPlayersContainerOverflow(playersContainer);
  }
}

function submitRound(content: Element): void {
  const scores: RoundScore[] = [];
  let winnerId: string | null = null;
  const nanPlayers: string[] = [];

  const playerCards = content.querySelectorAll<HTMLDivElement>('.uno-player-card');
  for (const card of playerCards) {
    const playerId = card.id.replace('player-card-', '');
    const isWinner = card.querySelector<HTMLInputElement>('#round-winner')?.checked;
    if (isWinner) {
      winnerId = playerId;
    }

    const score = card.querySelector<HTMLInputElement>('#round-score')?.value;
    let scoreNum = NaN;
    if (score) {
      scoreNum = parseInt(score, 10);
    }
    if (!isWinner) {
      if (Number.isNaN(scoreNum)) {
        nanPlayers.push(playerId);
        continue;
      }

      if (scoreNum.toString().length > endScore.toString().length + 1) {
        showErrorToast(`Too large number: ${scoreNum}`);
        return;
      }
    }

    scores.push({
      playerId: playerId,
      score: isWinner ? 0 : scoreNum,
    });
  }

  if (nanPlayers.length > 1 || (nanPlayers.length === 1 && winnerId)) {
    showErrorToast('All players scores must be numeric');
    return;
  }

  if (nanPlayers.length === 1) {
    const winner = nanPlayers[0]!;
    winnerId = winner;
    scores.push({
      playerId: winner,
      score: 0,
    });
  }

  if (!winnerId) {
    showErrorToast('You must select a winner');
    return;
  }

  if (!backend.currentRound) {
    showErrorToast('Invalid Round');
    return;
  }

  const round: RoundResult = {
    id: backend.currentRound.id,
    scores: scores,
    winner: winnerId,
  };

  try {
    backend.newRound(round);
  } catch (e) {
    showErrorToast(`Error while saving round results: ${e instanceof Error ? e.message : e}`);
    return;
  }

  const roundsTable = content.querySelector('#uno-rounds');
  if (roundsTable) {
    addRoundToTable(roundsTable, round);
  }

  content.querySelector('#new-round')?.classList.remove('uno-apply');
  showSuccessToast('Round Scoores Saved');
  refresh(content, true);
}

function handleUndo(content: Element): void {
  if ('notification' in navigator) {
    const notif = navigator.notification as {
      confirm: (
        message: string,
        callback?: (index: number) => void,
        title?: string,
        buttonLabels?: string[]
      ) => void;
    };
    notif.confirm(
      'Do you really want to remove last round?',
      (index) => onUndoConfirm(content, index),
      'Undo Last Round',
      ['OK', 'Cancel']
    );
  } else {
    const response = confirm('Are you really want to remove last round?');
    if (response) {
      onUndoConfirm(content, 1);
    }
  }
}

function onUndoConfirm(content: Element, index: number): void {
  if (index !== 1) {
    return;
  }

  database.removeLastRound();
  // its just resets the backend but without syncing and also reloads all stored rounds
  backend.restoreRounds();
  showSuccessToast('Last round is removed');
  reloadPage(content);
}

function handleReset(content: Element): void {
  if ('notification' in navigator) {
    const notif = navigator.notification as {
      confirm: (
        message: string,
        callback?: (index: number) => void,
        title?: string,
        buttonLabels?: string[]
      ) => void;
    };
    notif.confirm(
      'Do you really want to reset the game progress?',
      (index) => onResetConfirm(content, index),
      'Reset Game Progress',
      ['OK', 'Cancel']
    );
  } else {
    const response = confirm('Are you really want to reset game progress?');
    if (response) {
      onResetConfirm(content, 1);
    }
  }
}

function onResetConfirm(content: Element, index: number): void {
  if (index !== 1) {
    return;
  }

  backend.resetGame();
  showSuccessToast('Game Progress is Reset');
  reloadPage(content);
}

export function loadSettings(): void {
  const maxScore = getLocalItem(StorageCategory.Uno, 'maxScore');
  if (maxScore) {
    const valNum = parseInt(maxScore, 10);
    if (!Number.isNaN(valNum)) {
      endScore = valNum;
    } else {
      console.error('maxScore value is not a number, using default value');
    }
  }
}

export function reloadPage(content: Element): void {
  loadSettings();

  const roundsTable = content.querySelector('#uno-rounds');
  if (roundsTable) {
    drawTable(roundsTable);
    if (backend.rounds.length > 0) {
      for (const round of backend.rounds) {
        addRoundToTable(roundsTable, round);
      }
    }
  }

  refresh(content);
}

export function refresh(content: Element, checkWinner = false): void {
  const stats = backend.getStatistics(endScore);

  const newRoundBtn = content.querySelector('#new-round');
  if (newRoundBtn) {
    newRoundBtn.classList.remove('uno-apply');
    if (stats.gameEnded) {
      newRoundBtn.classList.add('hide');
    } else {
      newRoundBtn.classList.remove('hide');
    }

    refreshNewRoundBtn(newRoundBtn);
  }
  const cancelBtn = content.querySelector('#cancel');
  if (cancelBtn) {
    cancelBtn.classList.add('hide');
  }
  const undoBtn = content.querySelector('#undo');
  if (undoBtn) {
    if (backend.rounds.length > 0) {
      undoBtn.classList.remove('hide');
    } else {
      undoBtn.classList.add('hide');
    }
  }
  const resetBtn = content.querySelector('#reset');
  if (resetBtn) {
    if (backend.rounds.length > 0) {
      resetBtn.classList.remove('hide');
    } else {
      resetBtn.classList.add('hide');
    }
  }

  const roundsTableWrapper = content.querySelector('#uno-rounds-wrapper');
  if (roundsTableWrapper) {
    if (backend.rounds.length > 0) {
      roundsTableWrapper.classList.remove('hide');
    } else {
      roundsTableWrapper.classList.add('hide');
    }
  }

  const roundNumber = content.querySelector('#uno-stats-round');
  if (roundNumber) {
    if (backend.currentRound) {
      roundNumber.innerHTML = backend.currentRound.id.toString();
    } else {
      roundNumber.innerHTML = '0';
    }
  }
  const lastWinner = content.querySelector('#uno-stats-last-winner');
  if (lastWinner) {
    if (backend.lastRound?.result) {
      lastWinner.innerHTML = backend.lastRound.result.winner;
    } else {
      lastWinner.innerHTML = '';
    }
  }

  const playerStat = content.querySelector('#uno-stats-player');
  if (playerStat) {
    playerStat.classList.remove('green');
    if (stats.gameEnded) {
      playerStat.classList.add('green');
      playerStat.innerHTML = `
                <span class="uno-text title">Winner</span>
                <span class="uno-text bold">${stats.topPlayer.id}</span>
                <span class="uno-text">${stats.topPlayer.score}</span>`;
    } else if (backend.currentRound) {
      playerStat.innerHTML = `
                <span class="uno-text title">Shuf</span>
                <span class="uno-text bold">${backend.currentRound.shufflingTurn.id}</span>`;
    }
  }

  const highestScore = content.querySelector('#uno-stats-highest-score');
  if (highestScore) {
    highestScore.innerHTML = stats.highestScore.toString();
    if (highestScore.parentElement) {
      highestScore.parentElement.classList.remove('red', 'yellow');
      if (endScore * 0.75 < stats.highestScore) {
        highestScore.parentElement.classList.add('red');
      } else if (endScore / 3 < stats.highestScore) {
        highestScore.parentElement.classList.add('yellow');
      }
    }
  }

  const maxScore = content.querySelector('#uno-max-score');
  if (maxScore) {
    maxScore.innerHTML = `of ${endScore}`;
  }

  const playersContainer = content.querySelector('#uno-players');
  if (playersContainer) {
    let html = '';
    let topPlayerId: string = '';
    let lastPlayerId: string = '';

    if (stats.highestScore > 0) {
      topPlayerId = stats.topPlayer.id;
      if (stats.lastPlayer.id !== topPlayerId) {
        lastPlayerId = stats.lastPlayer.id;
      }
    }

    for (const player of backend.players) {
      let cls = 'uno-player-card card prime flex-col center';
      if (player.id === topPlayerId) {
        cls += ' green';
      } else if (player.id === lastPlayerId) {
        cls += ' red';
      }
      html += `
            <div id="player-card-${player.id}" class="${cls}">
                <span class="uno-text bold title">${player.id}</span>
                <span class="uno-text bold">${player.score}</span>
                <span class="uno-text" ${stats.sortResult.winsUsed ? 'style="font-weight: 600;"' : ''}>${player.wins} Win</span>
                <span class="uno-text ${!stats.sortResult.averageScoreUsed ? 'hide' : ''}">${player.averageScore}</span>
                <input id="round-score"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    class="form-control hide"
                    style="width: 3em;"/>
                <input id="round-winner"
                    type="radio"
                    name="round-winner"
                    class="form-control hide"/>
            </div>`;
    }
    playersContainer.innerHTML = html;

    fixPlayersContainerOverflow(playersContainer);
  }

  if (checkWinner && stats.gameEnded) {
    import('./celebrate').then((celebrate) => {
      celebrate.default(stats.topPlayer);
    });
  }
}

function refreshNewRoundBtn(newRoundBtn: Element): void {
  if (newRoundBtn.classList.contains('uno-apply')) {
    newRoundBtn.innerHTML = `
                <span class="material-icons">check</span>
                <span>Apply</span>`;
  } else {
    newRoundBtn.innerHTML = `
                <span class="material-icons">add</span>
                <span>New Round</span>`;
  }
}

async function route(content: HTMLDivElement): Promise<void> {
  content.innerHTML = main;

  // it initializes the whole backend and restores existing rounds
  backend.default();

  const newRoundBtn = content.querySelector('#new-round');
  if (newRoundBtn) {
    newRoundBtn.addEventListener('click', () => {
      if (newRoundBtn.classList.contains('disabled')) {
        return;
      }

      if (newRoundBtn.classList.contains('uno-apply')) {
        submitRound(content);
      } else {
        handleNewRound(content, newRoundBtn);
      }
      refreshNewRoundBtn(newRoundBtn);
    });
  }

  const cancelBtn = content.querySelector('#cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      refresh(content);
    });
  }

  const undoBtn = content.querySelector('#undo');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      handleUndo(content);
    });
  }

  const resetBtn = content.querySelector('#reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      handleReset(content);
    });
  }

  const configBtn = content.querySelector('#config');
  if (configBtn) {
    configBtn.addEventListener('click', async () => {
      const span = configBtn.querySelector('span');
      if (span && !span.classList.contains('rotate')) {
        span.classList.add('rotate');
        setTimeout(() => {
          span.classList.remove('rotate');
        }, 1000);
      }

      const settings = await import('./settings');
      settings.default(content);
    });
  }

  const playersContainer = content.querySelector('#uno-players');
  if (playersContainer) {
    setupInputNavigation(playersContainer as HTMLElement, (_) => {
      submitRound(content);
    });
  }

  reloadPage(content);
}

const page: Page = {
  id: 'uno',
  route: async (context) => {
    await route(context.content);
  },
};

export default page;
