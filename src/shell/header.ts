import { isProduction, app } from './bridge';
import { shellEvents } from './event';

export function setTitle(title: string): void {
  const headerTitle = document.querySelector('header .header-title');
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

shellEvents.on('router:page-change', (_) => {
  resetTitle();
  setVisibility(true);
});
