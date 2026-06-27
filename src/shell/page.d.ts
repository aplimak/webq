import { EventBus } from './event';
import { ScopedStorage, ShellState } from './storage';

interface GenericScopedStorage {
  reset: () => void;
}

/**
 * Represents a page in the application.
 * Each page has a unique id, routing logic, and optional cleanup logic.
 * The route function is called when the page is navigated to, and the exit function is called when navigating away from the page.
 * The PageContext provides the page with access to the content container and information about the previous route, allowing for dynamic content rendering and state management based on navigation history.
 * The id must be the same as the route path for the page to ensure proper routing and navigation within the application.
 */
export interface Page {
  /**
   * Unique id of the page.
   */
  readonly id: string;

  /**
   * Function that handles routing to the page. It receives a PageContext object that provides access to the content container and information about the previous route.
   * @param context The context for the page, including the content container and previous route.
   */
  route: (context: PageContext) => Promise<void>;

  /**
   * Optional function that is called when navigating away from the page. It receives the next route as an argument, allowing for cleanup or state management before the page is exited.
   * @param nextRoute The route that is being navigated to after exiting the page.
   */
  exit?: (nextRoute: string) => Promise<void>;

  /**
   * Page's scoped storage instance. mostly used for page reset after page crash.
   */
  storage?: GenericScopedStorage;
}

/**
 * Context provided to a page when it is routed to. It contains the content container where the page can render its content, and optionally the previous route for navigation history purposes.
 */
export interface PageContext {
  /**
   * The content container where the page can render its content. This is a div element that the page can manipulate to display its UI.
   */
  readonly content: HTMLDivElement;

  /**
   * The previous route that was navigated from, if available. This can be used for navigation history or to determine how the page should render based on where the user came from.
   */
  readonly previousRoute?: string;

  /**
   * Shell's public api.
   * NOTE: this api is mostly created for non-webpack pages, as they cant access the shell api directly. webpack pages better to use the exported functions on shell modules.
   */
  readonly api: {
    /**
     * Provides header control.
     * All changed done using the specified functions will be automatically reset upon page change and no cleanup needed.
     */
    header: {
      /**
       * Show the header area.
       */
      show: () => void;
      /**
       * Hide the header area.
       */
      hide: () => void;
      /**
       * Change the current header title.
       */
      setTitle: (title: string) => void;
    };
    /**
     * Shell's storage.
     * NOTE: it meant to be used only by shell modules or updated by shell or pages. dont add new values to it.
     */
    storage: ScopedStorage<ShellState>;
    /**
     * Shell's event bus.
     * NOTE: registered events won't be cleaned up automatically. make sure to clear all registered event handlers at page exit.
     */
    events: EventBus;
  };
}
