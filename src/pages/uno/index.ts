import {
  getLocalItem,
  StorageCategory,
  setLocalItem,
  setupInputNavigation,
  showErrorToast,
  showSuccessToast,
  scrollToBottom,
} from '@shell/utils';
import addPlayerForm from './addplayer.html';
import main from './main.html';
import settingsForm from './settings.html';
import { Page } from '@shell/page';
import './style.css';

import { Dialog } from '@shell/components/dialog';
import * as backend from './backend';
import * as database from './database';
import type { Player, PlayerDefinition, RoundResult, RoundScore } from './models';

let endScore = 300;

function comparePlayerDefs(a: PlayerDefinition[], b: PlayerDefinition[]): boolean {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      const itemA = a[i];
      const itemB = b[i];
      if (!itemA || !itemB) {
        return false;
      }
      if (itemA.id !== itemB.id || itemA.name !== itemB.name) {
        return false;
      }
    }
    return true;
  }

  return false; // If none of the above conditions are met, they are not equal
}

function drawTable(table: Element) {
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

function addRoundToTable(table: Element, round: RoundResult) {
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

function fixPlayersContainerOverflow(playersContainer: Element) {
  const containerWidth = (playersContainer as HTMLDivElement).offsetWidth;
  const scrollWidth = (playersContainer as HTMLDivElement).scrollWidth;

  if (scrollWidth > containerWidth) {
    playersContainer.classList.remove('middle');
  } else {
    playersContainer.classList.add('middle');
  }
}

function handleNewRound(content: Element, newRoundBtn: Element) {
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

function submitRound(content: Element) {
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

function handleUndo(content: Element) {
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

function onUndoConfirm(content: Element, index: number) {
  if (index !== 1) {
    return;
  }

  database.removeLastRound();
  // its just resets the backend but without syncing and also reloads all stored rounds
  backend.restoreRounds();
  showSuccessToast('Last round is removed');
  reloadPage(content);
}

function handleReset(content: Element) {
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

function onResetConfirm(content: Element, index: number) {
  if (index !== 1) {
    return;
  }

  backend.resetGame();
  showSuccessToast('Game Progress is Reset');
  reloadPage(content);
}

function handleSettings(content: Element) {
  let playerDefs = database.getPlayerDefs();

  function refreshPlayerDefsCards() {
    const playersContainer = dialog.body.querySelector('.uno-config-players');
    if (playersContainer) {
      playersContainer.innerHTML = '';
      for (const playerDef of playerDefs) {
        const card = document.createElement('div');
        card.classList.add('uno-config-player-item', 'card', 'flat', 'flex-row', 'center');
        card.innerHTML = `
                    <span class="text middle bold" style="font-size: 1.2em; min-width: 2.5em;border-radius: 50%;background-color: var(--object-background);min-height: 2.5em;align-content: center;">${playerDef.id}</span>
                    <span style="word-break: break-word;overflow-wrap: break-word;">${playerDef.name}</span>
                    <button class="button bordered center padded material-icons" style="margin-left: auto;">delete</button>`;
        card.querySelector('button')?.addEventListener('click', () => {
          playerDefs = playerDefs.filter((item) => item.id !== playerDef.id);
          playersContainer.removeChild(card);
        });
        playersContainer.appendChild(card);
      }
    }
  }

  function submitConfig() {
    let needReload = false;

    const maxScoreInput = dialog.body.querySelector('#max-score-input');
    if (maxScoreInput && maxScoreInput instanceof HTMLInputElement) {
      try {
        const val = maxScoreInput.value;
        const numVal = parseInt(val, 10);
        if (Number.isNaN(numVal)) {
          throw Error('Not a number');
        }
        setLocalItem(StorageCategory.Uno, 'maxScore', numVal.toString());
      } catch (e) {
        showErrorToast(`Error while updating max score: ${e instanceof Error ? e.message : e}`);
        return;
      }
    }

    try {
      const storedPlayerDefs = database.getPlayerDefs();
      if (!comparePlayerDefs(playerDefs, storedPlayerDefs)) {
        database.updatePlayerDefs(playerDefs);
        backend.restoreRounds();
        needReload = true;
      }
    } catch (e) {
      showErrorToast(`Error while saving players data: ${e instanceof Error ? e.message : e}`);
      return;
    }

    if (needReload) {
      reloadPage(content);
    } else {
      loadSettings();
      refresh(content);
    }
    showSuccessToast('Settings Saved Successfully');
    dialog.close();
  }

  const dialog = new Dialog('uno-config-dialog', 'Settings');
  dialog.autoCloseAfterClickingButton = false;
  dialog.resolvePromiseOnUnexpectedClose = true;
  dialog.body.innerHTML = settingsForm;
  setupInputNavigation(dialog.body, submitConfig);

  const maxScoreInput = dialog.body.querySelector('#max-score-input');
  if (maxScoreInput && maxScoreInput instanceof HTMLInputElement) {
    maxScoreInput.value = endScore.toString();
  }

  dialog.body.querySelector('#reset-players')?.addEventListener('click', () => {
    playerDefs = database.getDefaultPlayerDefs();
    refreshPlayerDefsCards();
  });

  dialog.body.querySelector('#add-player')?.addEventListener('click', () => {
    function submitNewPlayer() {
      const playerId = (
        innerDialog.body.querySelector('#player-id') as HTMLInputElement
      ).value.toUpperCase();
      if (!playerId) {
        showErrorToast('Player ID is required');
        return;
      } else if (playerId.length > 1) {
        showErrorToast('Player ID Must be one character');
        return;
      } else {
        const exists = playerDefs.filter((item) => item.id === playerId).length !== 0;
        if (exists) {
          showErrorToast('Player with this ID Already exists');
          return;
        }
      }

      const playerName = (innerDialog.body.querySelector('#player-name') as HTMLInputElement).value;
      if (!playerName) {
        showErrorToast('Player name is required');
        return;
      }

      playerDefs.push({
        id: playerId,
        name: playerName,
      });

      refreshPlayerDefsCards();

      innerDialog.close();
    }

    const innerDialog = new Dialog('nwq-player', 'New Player', [], dialog.container ?? undefined);
    innerDialog.autoCloseAfterClickingButton = false;
    innerDialog.resolvePromiseOnUnexpectedClose = true;

    innerDialog.body.innerHTML = addPlayerForm;
    setupInputNavigation(innerDialog.body, submitNewPlayer);

    innerDialog.addButton({
      text: 'Cancel',
      onClick: () => {
        innerDialog.close();
      },
    });

    innerDialog.addButton({
      text: 'OK',
      onClick: submitNewPlayer,
    });
    innerDialog.open();
  });

  refreshPlayerDefsCards();

  dialog.addButton({
    text: 'Cancel',
    onClick: () => {
      dialog.close();
    },
  });
  dialog.addButton({
    text: 'OK',
    onClick: submitConfig,
  });
  dialog.open();
}

function loadSettings() {
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

function reloadPage(content: Element) {
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

function announceWinner(winner: Player) {
  const dialog = new Dialog('winner-announcement', '');
  dialog.resolvePromiseOnUnexpectedClose = true;
  dialog.dialog.style.backgroundColor = '#00FF7F';
  dialog.dialog.style.color = '#000';
  dialog.header.classList.add('hide');
  dialog.footer.classList.add('hide');
  dialog.body.classList.add('flex-col', 'center');

  dialog.body.innerHTML = `
        <div class="flex-col center">
            <span class="text middle bold" style="margin-bottom: 16px;">The Game Winner is</span>
            <span class="text middle center" style="font-size: 2.5em;font-weight: 700;margin-bottom: 24px;">${winner.name}</span>
            <span style="font-size: 1.5em;font-weight: 600;">Score: ${winner.score}</span>
            <span style="font-size: 1.5em;font-weight: 600;">Wins: ${winner.wins}</span>
        </div>`;

  dialog.open();

  try {
    // Create the audio context (must be done inside the user gesture)
    const audioCtx = new window.AudioContext();

    // Resume if suspended (important for Chrome autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => _playAudio(audioCtx));
    } else {
      _playAudio(audioCtx);
    }

    dialog.promise.then(() => {
      audioCtx.close();
    });
  } catch (err) {
    showErrorToast(`Web Audio couldn't play: ${err}`);
    // Fallback: if Web Audio fails, at least the vibration works.
  }
}

function _playAudio(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;

  const freqs = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    1046.5, // C6
    880.0, // A5
    783.99, // G5
    659.25, // E5
    523.25, // C5
    659.25, // E5
    783.99, // G5
    1046.5, // C6
    987.77, // B5
    783.99, // G5
    659.25, // E5
    523.25, // C5
    1046.5, // C6
    987.77, // B5
    880.0, // A5
    783.99, // G5
    659.25, // E5 (ends on a bright note)
  ];

  // Each note: 0.4s duration + 0.1s gap = 0.5s per note.
  // 20 notes × 0.5s = exactly 10 seconds.
  const noteDuration = 0.1;
  const gap = 0.1;
  const step = noteDuration + gap;

  // Volume: 0.9 – loud but still clean (max is 1.0)
  const volume = 0.9;

  freqs.forEach((freq, index) => {
    const startTime = now + index * step;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // pure tone, pleasant
    osc.frequency.value = freq;

    // Envelope: quick attack, slight decay, then release
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + noteDuration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

function refresh(content: Element, checkWinner = false) {
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
    announceWinner(stats.topPlayer);
  }
}

function refreshNewRoundBtn(newRoundBtn: Element) {
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

async function route(content: HTMLDivElement) {
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
    configBtn.addEventListener('click', () => {
      const span = configBtn.querySelector('span');
      if (span && !span.classList.contains('rotate')) {
        span.classList.add('rotate');
        setTimeout(() => {
          span.classList.remove('rotate');
        }, 1000);
      }

      handleSettings(content);
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
