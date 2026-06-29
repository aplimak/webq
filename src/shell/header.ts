import { isProduction, app } from './bridge';
import { shellEvents } from './event';

export function setTitle(title: string): void {
  const headerTitle = document.querySelector('#header #title');
  if (headerTitle) {
    headerTitle.innerHTML = title;
  } else {
    throw Error('Header title not found');
  }
}

export function setVisibility(visible: boolean): void {
  const header = document.querySelector('header');
  if (header) {
    if (visible) {
      header.classList.remove('hide');
    } else {
      header.classList.add('hide');
    }
  } else {
    throw Error('Header not found');
  }
}

export function resetTitle(): void {
  let title = app.title;
  if (!isProduction) {
    title += ' (dev)';
  }
  setTitle(title);
}

export function getHeaderColor(): string {
  const header = document.querySelector('header');
  if (header) {
    const styles = getComputedStyle(header);
    const rgb = styles.backgroundColor;

    const matches = rgb.match(/\d+/g);
    if (!matches) throw new Error('Invalid color format');

    // Convert each component to hex and pad with leading zero if needed
    const hex = matches
      .slice(0, 3)
      .map((num) => parseInt(num, 10).toString(16).padStart(2, '0'))
      .join('');

    return `#${hex}`;
  } else {
    throw Error('Header not found');
  }
}

function updateThemeBtnIcon(useDarkTheme: boolean, initial: boolean): void {
  const btn = document.querySelector('header #switch-theme');
  if (!btn) {
    throw Error('Theme change button not found');
  }

  if (btn.classList.contains('hide')) {
    btn.classList.remove('hide');
  }

  const span = btn.querySelector('span');
  if (!span) {
    return;
  }

  let icon = 'brightness_';
  if (useDarkTheme) {
    icon += 'high';
  } else {
    icon += 'low';
  }
  span.innerHTML = icon;

  if (!initial && !span.classList.contains('rotate')) {
    span.classList.add('rotate');
    setTimeout(() => {
      span.classList.remove('rotate');
    }, 1000);
  }
}

function updateStatusBarColor(color: string): void {
  const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = color;
  }
}

shellEvents.on('router:page-change', (_) => {
  resetTitle();
  setVisibility(true);
});

shellEvents.on('ui:theme-change', (data) => {
  updateThemeBtnIcon(data.useDarkTheme, data.initial);
  updateStatusBarColor(getHeaderColor());
});

document.addEventListener('DOMContentLoaded', async () => {
  const { isDark, setTheme } = await import('./themeManager');

  const switchThemeButton = document.querySelector('header #switch-theme');
  if (switchThemeButton) {
    switchThemeButton.addEventListener('click', () => {
      setTheme(!isDark());
    });
  }
});
