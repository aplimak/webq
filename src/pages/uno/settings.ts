import * as database from './database';
import { Dialog } from '@/shell/components/dialog';
import {
  StorageCategory,
  setLocalItem,
  setupInputNavigation,
  showErrorToast,
  showSuccessToast,
} from '@/shell/utils';
import * as backend from './backend';
import { PlayerDefinition } from './models';
import { endScore, loadSettings, refresh, reloadPage } from '.';

import addPlayerForm from './addplayer.html';
import settingsForm from './settings.html';

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

export default function (content: Element): void {
  let playerDefs = database.getPlayerDefs();

  function refreshPlayerDefsCards(): void {
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

  function submitConfig(): void {
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
    function submitNewPlayer(): void {
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
