/**
 * Interface representing a storage backend that provides methods for getting, setting, and removing items by key. This allows for different storage implementations (e.g., localStorage, sessionStorage, or custom backends) to be used interchangeably with the ScopedStorage class.
 */
export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Options for configuring the ScopedStorage instance, including the storage backend, scope identifier, and optional default values.
 */
export interface StorageOptions<T> {
  /**
   * Identifier for the storage scope. This will be used as a prefix for all keys to avoid collisions with other instances.
   */
  id: string;

  /**
   * The storage backend to use (e.g., localStorage, sessionStorage, or a custom implementation).
   */
  storage: StorageBackend;

  /**
   * Optional default values for keys. If a key is not found in the storage, the value from this object will be returned if it exists.
   */
  defaultValue?: T;
}

/**
 * A scoped storage utility that provides a simple interface for storing and retrieving key-value pairs with a specific scope to avoid collisions.
 * It supports JSON serialization for complex data types and allows for default values when keys are not found.
 */
export class ScopedStorage<T extends Record<string, any>> {
  private readonly scope: string;
  private readonly storage: StorageBackend;
  private readonly defaultVal: T | undefined;

  constructor(options: StorageOptions<T>) {
    this.scope = `${options.id}`;
    this.storage = options.storage;
    this.defaultVal = options.defaultValue;
  }

  private getScopedKey(key: keyof T): string {
    return `${this.scope}:${String(key)}`;
  }

  /**
   * Retrieves a value from storage by key. If the key is not found, it returns the provided fallback value or the default value from the constructor if available. If neither is provided, it throws an error.
   * @param key The key to retrieve.
   * @param fallback An optional fallback value to return if the key is not found.
   * @returns The value associated with the key, or the fallback/default value if the key is not found.
   * @throws Will throw an error if the key is not found and no fallback or default value is provided.
   */
  get<K extends keyof T>(key: K, fallback?: T[K]): T[K] {
    const raw = this.storage.getItem(this.getScopedKey(key));
    if (raw === null) {
      if (fallback !== undefined) {
        return fallback;
      }
      if (this.defaultVal && key in this.defaultVal) {
        return this.defaultVal[key];
      }
      throw new Error(`Key "${String(key)}" not found and no default provided.`);
    }
    try {
      return JSON.parse(raw) as T[K];
    } catch {
      return raw as T[K];
    }
  }

  /**
   * Stores a value in storage under the specified key. The value is serialized to JSON before being stored.
   * @param key The key under which to store the value.
   * @param value The value to store. It will be serialized to JSON.
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.storage.setItem(this.getScopedKey(key), JSON.stringify(value));
  }

  /**
   * Removes a value from storage by key. If the key does not exist, this operation has no effect.
   * @param key The key of the value to remove.
   */
  remove<K extends keyof T>(key: K): void {
    this.storage.removeItem(this.getScopedKey(key));
  }
}

/**
 * Creates a ScopedStorage instance that uses localStorage as the backend, providing persistent storage that remains available across browser sessions. This is useful for data that should persist even after the browser is closed and reopened.
 * @param id A unique identifier for the storage scope to avoid key collisions with other instances.
 * @param defaultVal Optional default values for keys. If a key is not found in the storage, the value from this object will be returned if it exists.
 * @returns A ScopedStorage instance configured to use localStorage.
 */
export function createPersistentStorage<T extends Record<string, any>>(
  id: string,
  defaultVal?: T
): ScopedStorage<T> {
  return new ScopedStorage<T>({
    id,
    storage: localStorage,
    defaultValue: defaultVal,
  });
}

/**
 * Creates a ScopedStorage instance that uses sessionStorage as the backend, providing ephemeral storage that is cleared when the browser session ends. This is useful for temporary data that should not persist across sessions.
 * @param id A unique identifier for the storage scope to avoid key collisions with other instances.
 * @param defaultVal Optional default values for keys. If a key is not found in the storage, the value from this object will be returned if it exists.
 * @returns A ScopedStorage instance configured to use sessionStorage.
 */
export function createEphemeralStorage<T extends Record<string, any>>(
  id: string,
  defaultVal?: T
): ScopedStorage<T> {
  return new ScopedStorage<T>({
    id,
    storage: sessionStorage,
    defaultValue: defaultVal,
  });
}

export interface ShellState {
  useDarkTheme: boolean;
  defaultRoute: string;
}

export const shellStorage = createPersistentStorage<ShellState>('shell', {
  useDarkTheme: true,
  defaultRoute: 'home',
});
