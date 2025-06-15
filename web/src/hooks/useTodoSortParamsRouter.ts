import { useNavigate, useSearch } from '@tanstack/react-router';
import { Route as AssistantRoute } from '../routes/Assistant';
import { Route as BlogsRoute } from '../routes/blogs';

type AssistantRoute = typeof AssistantRoute;
type BlogsRoute = typeof BlogsRoute;

/**
 * Custom hook for managing todo sort parameters using TanStack Router
 *
 * @returns Object containing current sort params and functions to update them
 *
 * Features:
 * - Uses URL search params instead of localStorage for persistence
 * - URL is shareable and bookmarkable
 * - Type-safe parameter updates with Zod validation
 * - Supports filtering by completion status and search text
 * - Handles sorting by various fields with ascending/descending order
 *
 * Sort parameters include:
 * - sortBy: Field to sort by (created_at, updated_at, text, completed)
 * - sortOrder: Sort direction (asc, desc)
 * - completed: Filter by completion status (true, false, undefined for all)
 * - search: Search text to filter todos
 */
export const useTodoSortParamsRouter = (route: '/assistant' | '/blogs') => {
  let navigate: ReturnType<AssistantRoute['useNavigate']> | ReturnType<BlogsRoute['useNavigate']>;
  let search: ReturnType<AssistantRoute['useSearch']> | ReturnType<BlogsRoute['useSearch']>;

  if (route === '/assistant') {
    navigate = AssistantRoute.useNavigate();
    search = AssistantRoute.useSearch();
  } else {
    navigate = BlogsRoute.useNavigate();
    search = BlogsRoute.useSearch();
  }

  const sortParams = {
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    completed: search.completed,
    search: search.search,
  };

  /**
   * Update sort parameters
   * Merges new params with existing ones and updates URL
   *
   * @param newParams - Partial sort params to update
   */
  const updateSortParams = (newParams: Partial<typeof sortParams>) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        ...newParams,
      }),
    });
  };

  /**
   * Reset sort parameters to defaults
   * Clears all filters and resets to default sort order
   */
  const resetSortParams = () => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        sortBy: 'created_at',
        sortOrder: 'desc',
        completed: undefined,
        search: undefined,
      }),
    });
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
