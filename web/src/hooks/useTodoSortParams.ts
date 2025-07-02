import { useEffect, useState } from 'react';
import {
  type DEFAULT_SORT_PARAMS,
  getSortParamsFromStorage,
  resetSortParams as resetSortParamsInStorage,
  type SortParams,
  updateSortParams as updateSortParamsInStorage,
} from '../services/todoService';

/**
 * Custom hook for managing todo sort parameters
 *
 * @returns Object containing current sort params and functions to update them
 *
 * Features:
 * - Syncs with localStorage for persistence across sessions
 * - Broadcasts changes to other tabs/windows via storage events
 * - Provides type-safe parameter updates
 * - Supports filtering by completion status and search text
 * - Handles sorting by various fields with ascending/descending order
 *
 * Sort parameters include:
 * - sortBy: Field to sort by (created_at, updated_at, text, completed)
 * - sortOrder: Sort direction (asc, desc)
 * - completed: Filter by completion status (true, false, undefined for all)
 * - search: Search text to filter todos
 */
export const useTodoSortParams = () => {
  const [sortParams, setSortParams] = useState<SortParams>(getSortParamsFromStorage);

  /**
   * Listen for sort parameter changes from:
   * 1. Storage events (changes from other tabs/windows)
   * 2. Custom events (changes from the same tab)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'todo-sort-params') {
        setSortParams(getSortParamsFromStorage());
      }
    };

    const handleCustomStorageChange = () => {
      setSortParams(getSortParamsFromStorage());
    };

    // Listen to both native storage events and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('todoSortParamsChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('todoSortParamsChanged', handleCustomStorageChange);
    };
  }, []);

  /**
   * Update sort parameters
   * Merges new params with existing ones and persists to localStorage
   *
   * @param newParams - Partial sort params to update
   */
  const updateSortParams = (newParams: Partial<typeof DEFAULT_SORT_PARAMS>) => {
    updateSortParamsInStorage(newParams);
    // Local state will be updated via the event listener
  };

  /**
   * Reset sort parameters to defaults
   * Clears all filters and resets to default sort order
   */
  const resetSortParams = () => {
    resetSortParamsInStorage();
    // Local state will be updated via the event listener
  };

  /**
   * Get a human-readable description of current sort settings
   * Useful for displaying current filters/sort in UI
   *
   * @returns Formatted string describing current sort/filter state
   */
  const getSortDescription = () => {
    const parts: string[] = [];
    parts.push(`${sortParams.sortBy} (${sortParams.sortOrder})`);

    if (sortParams.completed !== undefined) {
      parts.push(sortParams.completed ? 'completed only' : 'incomplete only');
    }

    if (sortParams.search) {
      parts.push(`search: "${sortParams.search}"`);
    }

    return parts.join(' • ');
  };

  return {
    sortParams,
    updateSortParams,
    resetSortParams,
    getSortDescription,
  };
};
