import type { Page } from './page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMap = Record<string, any>;

/**
 * A Simple type-safe event bus.
 */
export class EventBus<T extends EventMap> {
  private listeners: {
    [K in keyof T]?: Array<(data: T[K]) => void>;
  } = {};

  /**
   * Subscribe to an event.
   * @param event The event to subscribe.
   * @param callback The event handler.
   * @returns An unsubscribe function.
   */
  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event.
   * @param event The event to unsubscribe.
   * @param callback The registered event handler.
   */
  off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter((cb) => cb !== callback);
  }

  /**
   * Trigger a event with data.
   * @param event The event to trigger.
   * @param data The event data to pass to event handlers.
   */
  emit<K extends keyof T>(event: K, data: T[K]): void;

  /**
   * Trigger a event.
   * @param event The event to trigger.
   */
  emit<K extends keyof T>(event: K): void;

  /**
   * Trigger a event with data.
   * @param event The event to trigger.
   * @param data The event data to pass to event handlers.
   */
  emit<K extends keyof T>(event: K, data?: T[K]): void {
    const callbacks = this.listeners[event];
    if (!callbacks) return;
    // Wrap in try/catch so one bad listener doesn't break the rest
    callbacks.forEach((cb) => {
      try {
        cb(data as T[K]);
      } catch (error) {
        console.error(`Error in event "${String(event)}":`, error);
      }
    });
  }

  /**
   * Subscribe to an event for only one trigger.
   * @param event The event to subscribe.
   * @param callback The event handler.
   * @returns An unsubscribe function.
   */
  once<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    const wrapper = (data: T[K]): void => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Wait for the next trigger of the event.
   * @param event The event to await.
   * @returns A promise that resolved at the next event trigger.
   */
  waitFor<K extends keyof T>(event: K): Promise<T[K]> {
    return new Promise((resolve) => {
      this.once(event, resolve);
    });
  }

  /**
   * Clear all handlers of a event.
   * @param event The event to clear handlers.
   */
  clear(event?: keyof T): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

interface ShellEvents {
  'router:before-page-change': {
    previousPage: string | null;
    newPage: string;
  };
  'router:page-change': {
    previousPage: string | null;
    newPage: string;
  };
  'router:page-changed': {
    page: Page;
  };
  'ui:theme-change': {
    useDarkTheme: boolean;
    initial: boolean;
  };
  'bridge:back-pressed': null;
}

/**
 * The shell's global event bus.
 */
export const shellEvents = new EventBus<ShellEvents>();
