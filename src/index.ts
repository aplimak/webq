import { hideLoading, showLoading } from './components/loading';
import initGlobals, { isDark, setTheme } from './globals';
import { navigateTo } from './utils';
import './bridge';

import './style.css';

let content: Element | null = null;

function handleNotFound(root: Element): void {
  root.innerHTML = '<h1>Page Not Found</h1>';
}

export async function navigate(route: string): Promise<void> {
  showLoading(true);

  if (route.startsWith('#')) {
    route = route.substring(1);
  }

  console.log(`Navigating to: ${route}`);

  if (!content) {
    console.error('content div not found');
    return;
  }

  // Update the URL in the browser's address bar
  window.location.hash = route;

  // Perform actions based on the route
  switch (route) {
    case '':
    case '/': {
      const main = await import('./main');
      await main.route(content);
      break;
    }
    case '/uno': {
      const uno = await import('./apps/uno');
      uno.route(content);
      break;
    }
    default:
      handleNotFound(content);
      break;
  }

  hideLoading();
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

window.addEventListener('hashchange', () => {
  navigate(window.location.hash || '/');
});

document.addEventListener('DOMContentLoaded', async () => {
  content = document.getElementById('content');

  initGlobals();

  const headerTitle = document.querySelector('.header-title');
  if (headerTitle && headerTitle instanceof HTMLDivElement) {
    headerTitle.style.cursor = 'pointer';
    headerTitle.addEventListener('click', () => {
      navigateTo('/');
    });
  }

  const switchThemeButton = document.querySelector('#switch-theme');
  if (switchThemeButton) {
    updateThemeBtnIcon(switchThemeButton);
    switchThemeButton.classList.remove('hide');
    switchThemeButton.addEventListener('click', () => {
      setTheme(!isDark, true);
      updateThemeBtnIcon(switchThemeButton, true);
    });
  }

  if (!window.location.hash) {
    window.location.hash = '/';
  } else {
    navigate(window.location.hash);
  }
});
