import { getLocalItem, StorageCategory, setLocalItem } from './utils';

export let isDark = false;

export function setTheme(dark: boolean, save: boolean = false): void {
  isDark = dark;

  if (save) {
    setLocalItem(StorageCategory.configuration, 'useDarkTheme', isDark ? '1' : '0');
  }

  applyTheme();
}

export function applyTheme(): void {
  import('./bridge').then((bridge) => {
    bridge.updateStatusBarColor(isDark ? '#2e2e2e' : '#f8f8f8', isDark);
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  });
}

function updateThemeBtnIcon(btn: Element, rotate = false): void {
  const span = btn.querySelector('span');
  if (!span) {
    return;
  }

  let icon = 'brightness_';
  if (isDark) {
    icon += 'high';
  } else {
    icon += 'low';
  }
  span.innerHTML = icon;

  if (rotate && !span.classList.contains('rotate')) {
    span.classList.add('rotate');
    setTimeout(() => {
      span.classList.remove('rotate');
    }, 1000);
  }
}

export function initTheme(): void {
  let dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDarkTheme = getLocalItem(StorageCategory.configuration, 'useDarkTheme');
  if (useDarkTheme) {
    dark = useDarkTheme !== '0';
  }

  setTheme(dark);

  const switchThemeButton = document.querySelector('#switch-theme');
  if (switchThemeButton) {
    updateThemeBtnIcon(switchThemeButton);
    switchThemeButton.classList.remove('hide');
    switchThemeButton.addEventListener('click', () => {
      setTheme(!isDark, true);
      updateThemeBtnIcon(switchThemeButton, true);
    });
  }
}
