/**
 * @file A small React hook library for interacting with WXT Storage.
 * @author Alex Nahas
 */

import {
  type StorageItemKey,
  storage,
  type WxtStorageItem,
  type WxtStorageItemOptions,
} from '@wxt-dev/storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// If you're using WXT directly, you can do:
// import { storage, WxtStorageItemOptions, WxtStorageItem } from 'wxt/storage';

/* ----------------------------------------------------------------------------
 * 1) useStorageItem
 * --------------------------------------------------------------------------- */

/**
 * React hook to bind to the value of a single storage item, watching for changes
 * and providing setter & remover functions.
 *
 * @template T Type of the stored value.
 * @param {string} key - Full storage key (must include an area prefix like `local:`).
 * @param {WxtStorageItemOptions<T>} [options] - Options for defining this storage item.
 *  - `fallback` default value to return if none is stored
 *  - `init` function to run for initialization if value not found
 *  - `version` the version number for the storage item
 *  - `migrations` an object mapping version => migration function
 *  - etc.
 *
 * @returns {{
 *   value: T | null;
 *   setValue: (newValue: T) => Promise<void>;
 *   removeValue: () => Promise<void>;
 *   loading: boolean;
 *   error: unknown;
 * }}
 *
 * @example
 * ```tsx
 * export function App() {
 *   const {
 *     value: theme,
 *     setValue: setTheme,
 *     removeValue: removeTheme,
 *     loading,
 *     error,
 *   } = useStorageItem<'light' | 'dark'>('local:theme', {
 *     fallback: 'light',
 *   });
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {String(error)}</p>;
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <button onClick={removeTheme}>Remove theme</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStorageItem<T>(
  key: StorageItemKey | null,
  options: WxtStorageItemOptions<T> = {}
): {
  value: T | null;
  setValue: (newValue: T) => Promise<void>;
  removeValue: () => Promise<void>;
  loading: boolean;
  error: unknown;
} {
  const itemRef = useRef<WxtStorageItem<T, Record<string, unknown>> | null>(null);

  // Track the current value in state
  const [value, setValue] = useState<T | null>(null);
  // Track async loading & errors
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  // Lazily define the item once
  if (!itemRef.current && key !== null) {
    itemRef.current = storage.defineItem<T>(key, options);
  }

  /**
   * Internal function to fetch the current value from storage,
   * set up watchers, etc.
   */
  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const initialValue = await itemRef.current!.getValue();
      setValue(initialValue);

      // Watch for changes to this storage item
      const unwatch = itemRef.current!.watch((newVal) => {
        setValue(newVal);
      });

      return () => {
        unwatch();
      };
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  // On mount/unmount, initialize once
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initialize().then((unwatch) => {
      cleanup = unwatch;
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, [initialize, key]);

  /**
   * Set the storage value, overriding the current.
   */
  const handleSetValue = useCallback(async (newValue: T) => {
    try {
      await itemRef.current!.setValue(newValue);
    } catch (err) {
      setError(err);
    }
  }, []);

  /**
   * Remove the storage value entirely.
   */
  const handleRemoveValue = useCallback(async () => {
    try {
      await itemRef.current!.removeValue();
    } catch (err) {
      setError(err);
    }
  }, []);

  return {
    value,
    setValue: handleSetValue,
    removeValue: handleRemoveValue,
    loading,
    error,
  };
}

/* ----------------------------------------------------------------------------
 * 2) useStorageWatch
 * --------------------------------------------------------------------------- */

/**
 * React hook to watch a single storage key (or multiple keys) for changes,
 * without necessarily reading or writing the current values. This is a lower-level
 * hook for quickly subscribing to changes.
 *
 * @param {StorageItemKey | StorageItemKey[]} keys - The key or array of keys to watch.
 * @param {(changes: Record<string, {oldValue: unknown; newValue: unknown}>) => void} callback
 *        A callback triggered whenever one of the provided keys changes.
 *
 * @returns {void}
 *
 * @example
 * ```ts
 * useStorageWatch('local:installDate', (changes) => {
 *   console.log('installDate changed:', changes);
 * });
 * ```
 */
export function useStorageWatch(
  keys: StorageItemKey | StorageItemKey[],
  callback: (changes: Record<string, { oldValue: unknown; newValue: unknown }>) => void
): void {
  // Convert single key to array if needed.
  const watchKeys = Array.isArray(keys) ? keys : [keys];

  useEffect(() => {
    // Subscribe once on mount
    const unsubscribers = watchKeys.map((key) =>
      storage.watch(key, (newVal, oldVal) => {
        callback({
          [key]: { oldValue: oldVal, newValue: newVal },
        });
      })
    );

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [keys, callback]);
}

/* ----------------------------------------------------------------------------
 * 3) useStorageMeta
 * --------------------------------------------------------------------------- */

/**
 * React hook to read and set metadata for a specific storage item. If you only need
 * versioning, you may rely on `storage.defineItem(..., { version, migrations })`,
 * but if you want to manage custom metadata yourself, this hook can help.
 *
 * @template M - The shape of the metadata object (e.g. `{ v?: number; lastModified?: number }`).
 * @param {string} key - The *full* storage key (must include an area prefix).
 *
 * @returns {{
 *   meta: M | null;
 *   setMeta: (partialMeta: Partial<M>) => Promise<void>;
 *   removeMeta: (keys?: keyof M | (keyof M)[]) => Promise<void>;
 *   loading: boolean;
 *   error: unknown;
 * }}
 *
 * @example
 * ```ts
 * const { meta, setMeta, removeMeta } = useStorageMeta<{ v: number }>('local:example');
 *
 * // Set or update any subset of metadata
 * setMeta({ v: 2 });
 *
 * // Remove the entire metadata object
 * removeMeta();
 * ```
 */
export function useStorageMeta<M extends Record<string, unknown>>(key: StorageItemKey) {
  const [meta, setMetaState] = useState<M | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const initializeMeta = useCallback(async () => {
    setLoading(true);
    try {
      const currentMeta = await storage.getMeta<M>(key);
      setMetaState(currentMeta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    initializeMeta();
  }, [initializeMeta]);

  /**
   * Merge in new metadata properties for this key.
   */
  const handleSetMeta = useCallback(
    async (partialMeta: Partial<M>) => {
      try {
        await storage.setMeta<Partial<M>>(key, partialMeta);
        // Refresh local state
        const newMeta = await storage.getMeta<M>(key);
        setMetaState(newMeta);
      } catch (err) {
        setError(err);
      }
    },
    [key]
  );

  /**
   * Remove specific meta properties, or the entire metadata object if no arguments.
   */
  const handleRemoveMeta = useCallback(
    async (props?: keyof M | (keyof M)[]) => {
      try {
        await storage.removeMeta(key, props as any);
        // Refresh local state
        const newMeta = await storage.getMeta<M>(key);
        setMetaState(newMeta);
      } catch (err) {
        setError(err);
      }
    },
    [key]
  );

  return {
    meta,
    setMeta: handleSetMeta,
    removeMeta: handleRemoveMeta,
    loading,
    error,
  };
}

/* ----------------------------------------------------------------------------
 * 4) Bulk Operations Example
 * --------------------------------------------------------------------------- */

/**
 * Example of a bulk get function as a React hook. You can build similar hooks
 * for `setItems`, `removeItems`, etc., if desired.
 *
 * @param {string[]} keys - The full storage keys to get in bulk.
 * @returns {{
 *   items: Record<string, unknown>;
 *   loading: boolean;
 *   error: unknown;
 *   refetch: () => void;
 * }}
 *
 * @example
 * ```ts
 * const { items, loading, error, refetch } = useStorageBulkGet(['local:key1', 'local:key2']);
 * ```
 */
export function useStorageBulkGet(keys: StorageItemKey[]) {
  const [items, setItems] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const results = await storage.getItems(keys);
      const mapped: Record<string, unknown> = {};
      for (const { key, value } of results) {
        mapped[key] = value;
      }
      setItems(mapped);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [keys]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
  };
}
