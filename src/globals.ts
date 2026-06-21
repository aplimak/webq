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

export default function (): void {
  let dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDarkTheme = getLocalItem(StorageCategory.configuration, 'useDarkTheme');
  if (useDarkTheme) {
    dark = useDarkTheme !== '0';
  }

  setTheme(dark);
}
