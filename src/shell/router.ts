import { navigateTo } from './utils';
import { shellStorage } from './storage';
import { Page } from './page';

const DEFAULT_ROUTE = shellStorage.get('defaultRoute');

export let currentPage: Page | null = null;

export function inMainPage(): boolean {
  return window.location.hash.slice(1) === DEFAULT_ROUTE;
}

function handleNotFound(root: Element, route: string): void {
  root.innerHTML = `<h1>Page Not Found: ${route}</h1>`;
}

function handlePageCrash(root: Element, route: string, page: Page, error: unknown): void {
  let html = `
  <h1>Page ${route} Crashed</h1>
  <h2>
  <code>Page ID: ${page.id}</code>
  <br>
  <code>${error instanceof Error ? `name: ${error.name}, cause: ${error.cause}, message: ${error.message}` : error}</code>
  </h2>
  `;

  if (error instanceof Error && error.stack) {
    for (const stack of error.stack.split('\n')) {
      html += `<code>${stack}</code>`;
    }
  }

  root.innerHTML = html;
}

async function initRoute(): Promise<void> {
  async function navigate(route: string): Promise<void> {
    if (route.startsWith('#')) {
      route = route.substring(1);
    }

    console.log(`Navigating to: ${route}`);

    // Update the URL in the browser's address bar
    window.location.hash = route;

    // Perform actions based on the route
    document.startViewTransition(async () => {
      try {
        if (currentPage?.exit) {
          await currentPage.exit(route);
        }
      } catch (error) {
        console.warn(`Error while exiting page: ${currentPage?.id}`, error);
      }

      let page: Page;

      try {
        const module = await import(`../pages/${route}`);
        page = module.default as Page;
      } catch (error) {
        console.error(`Page "${route}" not found:`, error);
        handleNotFound(content!, route);
        return;
      }

      try {
        if (typeof page.route !== 'function') {
          throw Error('Page is not routable');
        }
        if (page.id !== route) {
          throw Error(`Page id: ${page.id} does not match route: ${route}`);
        }

        const prevPage = currentPage;
        currentPage = page;

        await currentPage.route({
          content: content,
          previousRoute: prevPage?.id,
        });
      } catch (error) {
        console.error(`Page "${route}" crashed:`, error);
        handlePageCrash(content, route, page, error);
        return;
      }
    });
  }

  function doNavigate(): void {
    navigate(window.location.hash.slice(1) || DEFAULT_ROUTE);
  }

  const _content = document.getElementById('content');
  if (!(_content instanceof HTMLDivElement)) {
    throw Error('Invalid content container');
  }
  const content = _content;

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
}

document.addEventListener('DOMContentLoaded', initRoute);
