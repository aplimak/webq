import { initTheme } from './shell/themeManager';
import { navigateTo } from './shell/utils';
import './shell/bridge';

import './shell/style.css';

let content: Element | null = null;
let currentCleanup: (() => void) | null = null;
const DEFAULT_ROUTE = 'home';

function handleNotFound(root: Element): void {
  root.innerHTML = '<h1>Page Not Found</h1>';
}

export async function navigate(route: string): Promise<void> {
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
  document.startViewTransition(async () => {
    if (currentCleanup) {
      currentCleanup(); // Calls the destroy() function returned by the previous page
      currentCleanup = null;
    }

    try {
      const module = await import(`./pages/${route}`);

      const result = await module.default(content);

      if (typeof result === 'function') {
        currentCleanup = result; // Store cleanup for the next navigation
      }
    } catch (error) {
      console.error(`Page "${route}" not found:`, error);
      handleNotFound(content!);
    }
  });
}

window.addEventListener('hashchange', () => {
  navigate(window.location.hash.slice(1) || DEFAULT_ROUTE);
});

document.addEventListener('DOMContentLoaded', async () => {
  content = document.getElementById('content');

  initTheme();

  const headerTitle = document.querySelector('.header-title');
  if (headerTitle && headerTitle instanceof HTMLDivElement) {
    headerTitle.style.cursor = 'pointer';
    headerTitle.addEventListener('click', () => {
      navigateTo('home');
    });
  }

  const initialRoute = window.location.hash.slice(1) || DEFAULT_ROUTE;
  navigate(initialRoute);
});
