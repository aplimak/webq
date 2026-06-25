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

window.electron.events.onEscape(async () => {
  const router = await import('@shell/router');

  if (router.inMainPage()) {
    window.electron.mainWindow.close();
  } else {
    window.history.back();
  }
});

window.electron.events.onResize(() => {
  const maxBtn = document.querySelector('#window-maximize')!;
  updateMaxBtnIcon(maxBtn);
});
