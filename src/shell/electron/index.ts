import { shellEvents } from '../event';

export interface ElectronAPI {
  mainWindow: {
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    isMaximized: () => Promise<boolean | undefined>;
  };
  events: {
    onEscape: (callback: () => void) => () => void;
    onResize: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export async function quit(): Promise<void> {
  await window.electron.mainWindow.close();
}

async function updateMaxBtnIcon(maxBtn: Element): Promise<void> {
  const span = maxBtn.querySelector('span')!;
  span.innerHTML = (await window.electron.mainWindow.isMaximized())
    ? 'close_fullscreen'
    : 'open_in_full';
}

document.addEventListener('DOMContentLoaded', async () => {
  const closeBtn = document.querySelector('#window-close')!;
  closeBtn.classList.remove('hide');
  closeBtn.addEventListener('click', () => {
    window.electron.mainWindow.close();
  });

  const maxBtn = document.querySelector('#window-maximize')!;
  maxBtn.classList.remove('hide');
  updateMaxBtnIcon(maxBtn);
  maxBtn.addEventListener('click', () => {
    window.electron.mainWindow.maximize();
  });

  const minBtn = document.querySelector('#window-minimize')!;
  minBtn.classList.remove('hide');
  minBtn.addEventListener('click', () => {
    window.electron.mainWindow.minimize();
  });
});

window.electron.events.onEscape(() => {
  shellEvents.emit('bridge:back-pressed');
});

window.electron.events.onResize(() => {
  const maxBtn = document.querySelector('#window-maximize')!;
  updateMaxBtnIcon(maxBtn);
});
