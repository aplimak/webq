import { shellEvents } from './event';
import { shellStorage } from './storage';

let useDarkTheme = false;

export function setTheme(dark: boolean, initial: boolean = false): void {
  const isChanged = useDarkTheme !== dark;
  useDarkTheme = dark;

  if (isChanged && !initial) {
    shellStorage.set('useDarkTheme', dark);
  }
  if (!isChanged && !initial) {
    // No need to do anything.
    return;
  }

  document.body.setAttribute('data-theme', useDarkTheme ? 'dark' : 'light');
  shellEvents.emit('ui:theme-change', {
    useDarkTheme: useDarkTheme,
    initial,
  });
}

export function isDark(): boolean {
  return useDarkTheme;
}

document.addEventListener('DOMContentLoaded', async () => {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDarkTheme = shellStorage.get('useDarkTheme', systemDark);

  setTheme(useDarkTheme, true);
});
