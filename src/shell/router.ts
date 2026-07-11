import { shellStorage } from './storage';
import type { Page, PageContext } from './page';
import { shellEvents } from './event';
import { Mutex } from 'async-mutex';

const DEFAULT_ROUTE = shellStorage.get('defaultRoute');
const mutex = new Mutex();

let currentHash: string | null = null;
export let currentPage: Page | null = null;

export function inMainPage(): boolean {
  return window.location.hash.slice(1) === DEFAULT_ROUTE;
}

export function navigateTo(route: string): void {
  window.location.hash = route;
}

function addHelperBtns(
  container: HTMLDivElement,
  options: { refresh?: boolean; home?: boolean; resetData?: boolean }
): void {
  if (options.refresh) {
    container.innerHTML += `
    <button id="router-refresh"
      class="button filled flex-row center padded gapped bold primary">
      <span class="material-icons">replay</span>
      <span>Refresh Page</span>
    </button>`;
  }
  if (options.home) {
    container.innerHTML += `
    <button id="router-home"
      class="button filled flex-row center padded gapped bold primary">
      <span class="material-icons">home</span>
      <span>Return to Home</span>
    </button>`;
  }
  if (options.resetData) {
    container.innerHTML += `
    <button id="router-reset-data"
      class="button filled flex-row center padded gapped bold primary">
      <span class="material-icons">delete</span>
      <span>${currentPage?.storageReset ? 'Reset Page' : 'Clear Data'}</span>
    </button>`;
  }

  container.querySelector('#router-refresh')?.addEventListener('click', () => {
    window.location.reload();
  });

  container.querySelector('#router-home')?.addEventListener('click', () => {
    navigateTo(DEFAULT_ROUTE);
  });

  container.querySelector('#router-reset-data')?.addEventListener('click', () => {
    if (currentPage?.storageReset) {
      currentPage.storageReset();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }

    window.location.reload();
  });
}

function handleNotFound(root: Element, route: string): void {
  root.innerHTML = `<h1>Page Not Found: ${route}</h1>`;

  const btnContainer = document.createElement('div');
  btnContainer.classList.add('flex-row', 'gapped');
  addHelperBtns(btnContainer, {
    home: true,
  });
  root.appendChild(btnContainer);
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

  const btnContainer = document.createElement('div');
  btnContainer.classList.add('flex-row', 'gapped', 'padded');
  addHelperBtns(btnContainer, {
    refresh: true,
    home: true,
    resetData: true,
  });
  root.appendChild(btnContainer);
}

async function initRoute(): Promise<void> {
  async function processRoute(route: string, subRoute?: string): Promise<void> {
    try {
      if (currentPage?.exit) {
        await currentPage.exit(route);
      }
    } catch (error) {
      console.warn(`Error while exiting page: ${currentPage?.id}`, error);
    }

    const comp = await import('./components');
    comp.loading.show();

    shellEvents.emit('router:page-change', {
      previousPage: currentPage?.id || null,
      newPage: route,
    });

    content.innerHTML = '';
    document.body.setAttribute('data-page', route);

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

      let api: PageContext['api'];
      {
        const { shellEvents: events } = await import('./event');
        const { shellStorage: storage } = await import('./storage');
        const header = await import('./header');
        const { setTitle } = header;
        api = {
          header: {
            show(): void {
              header.setVisibility(true);
            },
            hide(): void {
              header.setVisibility(false);
            },
            setTitle,
          },
          storage,
          events,
        };
      }

      await currentPage.route({
        content,
        subRoute,
        previousRoute: prevPage?.id,
        api,
      });
    } catch (error) {
      console.error(`Page "${route}" crashed:`, error);
      handlePageCrash(content, route, page, error);
      return;
    }

    shellEvents.emit('router:page-changed', {
      page: currentPage,
    });

    import('./components').then((comp) => {
      comp.loading.hide();
    });
  }
  async function navigate(path: string): Promise<void> {
    if (path.startsWith('#')) {
      path = path.substring(1);
    }

    const subRouteIndex = path.indexOf('/');
    const result =
      subRouteIndex === -1 ? [path] : [path.slice(0, subRouteIndex), path.slice(subRouteIndex + 1)];

    const route = result[0];
    const subRoute = result.at(1);

    shellEvents.emit('router:before-page-change', {
      previousPage: currentPage?.id || null,
      newPage: route,
    });

    console.log(`Navigating to: ${route}`);

    // Update the URL in the browser's address bar
    window.location.hash = path;

    await processRoute(route, subRoute);

    const comp = await import('./components');
    comp.loading.hide();
  }

  async function doNavigate(): Promise<void> {
    const newHash = window.location.hash.slice(1) || DEFAULT_ROUTE;
    if (currentHash === newHash) return;
    currentHash = newHash;
    await navigate(newHash);
  }

  const _content = document.getElementById('content');
  if (!(_content instanceof HTMLDivElement)) {
    throw Error('Invalid content container');
  }
  const content = _content;

  window.addEventListener('hashchange', () => {
    mutex.runExclusive(doNavigate);
  });

  const headerBranding = document.querySelector('#header #branding');
  if (headerBranding && headerBranding instanceof HTMLDivElement) {
    headerBranding.style.cursor = 'pointer';
    headerBranding.addEventListener('click', () => {
      navigateTo('home');
    });
  }

  if (!('shouldNavigate' in window.nativeBridge) || (await window.nativeBridge.shouldNavigate())) {
    mutex.runExclusive(doNavigate);
  }
}

document.addEventListener('DOMContentLoaded', initRoute);

shellEvents.on('bridge:back-pressed', async (data) => {
  if (window.nativeBridge.platform !== 'browser' && (inMainPage() || !data?.canGoBack)) {
    await window.nativeBridge.quit();
  } else {
    window.history.back();
  }
});
