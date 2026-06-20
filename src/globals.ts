import axios from 'axios';
import { getLocalItem, StorageCategory, setLocalItem } from './utils';

export let isDark = false;

export function setTheme(dark: boolean, save: boolean = false) {
  isDark = dark;

  if (save) {
    setLocalItem(StorageCategory.configuration, 'useDarkTheme', isDark ? '1' : '0');
  }

  applyTheme();
}

export function applyTheme() {
  if (isDark) {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.setAttribute('data-theme', 'light');
  }
}

export default function () {
  let dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDarkTheme = getLocalItem(StorageCategory.configuration, 'useDarkTheme');
  if (useDarkTheme) {
    dark = useDarkTheme !== '0';
  }

  setTheme(dark);
}
