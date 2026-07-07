import { shellStorage } from './storage';
import type { Page, PageContext } from './page';
import { shellEvents } from './event';

const DEFAULT_ROUTE = shellStorage.get('defaultRoute');

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
  async function processRoute(route: string): Promise<void> {
    try {
      if (currentPage?.exit) {
        await currentPage.exit(route);
      }
    } catch (error) {
      console.warn(`Error while exiting page: ${currentPage?.id}`, error);
    }

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
        content: content,
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
  }
  async function navigate(route: string): Promise<void> {
    if (route.startsWith('#')) {
      route = route.substring(1);
    }

    shellEvents.emit('router:before-page-change', {
      previousPage: currentPage?.id || null,
      newPage: route,
    });

    console.log(`Navigating to: ${route}`);

    // Update the URL in the browser's address bar
    window.location.hash = route;

    // Perform actions based on the route
    if (currentPage && 'startViewTransition' in document) {
      document.startViewTransition(async () => await processRoute(route));
    } else {
      await processRoute(route);
    }
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

  const headerBranding = document.querySelector('#header #branding');
  if (headerBranding && headerBranding instanceof HTMLDivElement) {
    headerBranding.style.cursor = 'pointer';
    headerBranding.addEventListener('click', () => {
      navigateTo('home');
    });
  }
}

document.addEventListener('DOMContentLoaded', initRoute);

shellEvents.on('bridge:back-pressed', async () => {
  if (inMainPage() && window.nativeBridge.platform !== 'browser') {
    await window.nativeBridge.quit();
  } else {
    window.history.back();
  }
});

// Honestly, there is no point on chunking components when we need it at the first route. but we may decrease the initial load time.
shellEvents.on('router:page-change', async () => {
  const { loading } = await import('./components');
  loading.show();
});

shellEvents.on('router:page-changed', async () => {
  const { loading } = await import('./components');
  loading.hide();
});
