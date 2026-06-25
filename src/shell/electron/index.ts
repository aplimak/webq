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
    updateMaxBtnIcon(maxBtn);
  });

  const minBtn = document.querySelector('#window-minimize')!;
  minBtn.classList.remove('hide');
  minBtn.addEventListener('click', () => {
    window.electron.mainWindow.minimize();
  });
});
