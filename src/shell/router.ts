import { navigateTo } from './utils';

let content: Element | null = null;
let currentCleanup: (() => void) | null = null;
const DEFAULT_ROUTE = 'home';

function handleNotFound(root: Element, route: string): void {
  root.innerHTML = `<h1>Page Not Found: ${route}</h1>`;
}

async function navigate(route: string): Promise<void> {
  if (!content) {
    console.error('content div not found');
    return;
  }

  if (route.startsWith('#')) {
    route = route.substring(1);
  }

  console.log(`Navigating to: ${route}`);

  // Update the URL in the browser's address bar
  window.location.hash = route;

  // Perform actions based on the route
  document.startViewTransition(async () => {
    if (currentCleanup) {
      currentCleanup(); // Calls the destroy() function returned by the previous page
      currentCleanup = null;
    }

    try {
      const module = await import(`../pages/${route}`);

      const result = await module.default(content);

      if (typeof result === 'function') {
        currentCleanup = result; // Store cleanup for the next navigation
      }
    } catch (error) {
      console.error(`Page "${route}" not found:`, error);
      handleNotFound(content!, route);
    }
  });
}

function doNavigate() {
  navigate(window.location.hash.slice(1) || DEFAULT_ROUTE);
}

document.addEventListener('DOMContentLoaded', async () => {
  content = document.getElementById('content');
  doNavigate();

  window.addEventListener('hashchange', () => {
    doNavigate();
  });

  const headerTitle = document.querySelector('.header-title');
  if (headerTitle && headerTitle instanceof HTMLDivElement) {
    headerTitle.style.cursor = 'pointer';
    headerTitle.addEventListener('click', () => {
      navigateTo('home');
    });
  }
});
