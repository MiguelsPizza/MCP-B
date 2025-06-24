
import { hc } from 'hono/client';
import type { AppType } from '../../worker';
import type { ErrorResponse, Todo } from '../../worker/db/schema';

const client = hc<AppType>(location.origin);

export type SortParams = {
  sortBy: keyof Todo;
  sortOrder: 'desc' | 'asc';
  completed: boolean | undefined;
  search: string | undefined;
};

export const DEFAULT_SORT_PARAMS = {
  sortBy: 'created_at',
  sortOrder: 'desc',
  completed: undefined,
  search: undefined,
} as const satisfies SortParams;

const SORT_PARAMS_KEY = 'todo-sort-params';

export class TodoApiError extends Error {
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly statusCode: number;
  public readonly originalError: ErrorResponse;

  constructor(errorResponse: ErrorResponse, statusCode: number, defaultMessage: string) {
    const message = errorResponse.message || errorResponse.error || defaultMessage;
    super(message);
    this.name = 'TodoApiError';
    this.code = errorResponse.code;
    this.details = errorResponse.details;
    this.statusCode = statusCode;
    this.originalError = errorResponse;
  }

  get errorResponse(): ErrorResponse {
    return this.originalError;
  }

  get isNotFound(): boolean {
    return this.code === 'NOT_FOUND';
  }

  get isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  get isUniqueConstraintError(): boolean {
    return this.code === 'UNIQUE_CONSTRAINT_FAILED';
  }

  get isDatabaseError(): boolean {
    return this.code === 'DATABASE_ERROR';
  }
}

const handleApiError = async (res: Response, defaultMessage: string): Promise<never> => {
  try {
    const errorData = await res.json();

    if (
      errorData &&
      typeof errorData === 'object' &&
      'success' in errorData &&
      errorData.success === false &&
      'error' in errorData
    ) {
      const zodError = errorData as { success: false; error: { name: string; message: string } };

      let errorMessage = 'Validation error';
      try {
        const errors = JSON.parse(zodError.error.message) as Array<{
          path: string[];
          message: string;
          code?: string;
          minimum?: number;
        }>;

        const fieldErrors = errors
          .map((err) => {
            const field = err.path.join('.');
            return `${field}: ${err.message}`;
          })
          .join(', ');

        errorMessage = fieldErrors || 'Validation failed';
      } catch {
        errorMessage = zodError.error.message || 'Validation failed';
      }

      const normalizedError: ErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: errorMessage,
        code: 'VALIDATION_ERROR',
        details: errorData,
      };

      throw new TodoApiError(normalizedError, res.status, defaultMessage);
    }

    const typedErrorData = errorData as ErrorResponse;

    const normalizedError: ErrorResponse = {
      error: typedErrorData.error || defaultMessage,
      message: typedErrorData.message || typedErrorData.error || defaultMessage,
      code: typedErrorData.code || 'HTTP_ERROR',
      details: typedErrorData.details,
    };

    throw new TodoApiError(normalizedError, res.status, defaultMessage);
  } catch (parseError) {
    if (parseError instanceof TodoApiError) {
      throw parseError;
    }

    const errorResponse: ErrorResponse = {
      error: defaultMessage,
      message: res.statusText || defaultMessage,
      code: 'HTTP_ERROR',
    };
    throw new TodoApiError(errorResponse, res.status, defaultMessage);
  }
};

export type TodosGetQueryParams = Parameters<typeof client.api.todos.$get>[0]['query'];
export type UserTodosGetQueryParams = Parameters<
  (typeof client.api.users)[':userId']['todos']['$get']
>[0]['query'];
export type TodosPostJsonBody = Parameters<(typeof client.api.todos)['$post']>[0]['json'];
export type TodoPutJsonBody = Parameters<(typeof client.api.todos)[':id']['$put']>[0]['json'];

export const todoApi = {
  async getAll(queryParams?: TodosGetQueryParams) {
    const res = await client.api.todos.$get({
      query: queryParams || {},
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to get todos');
    }

    return await res.json();
  },

  async getById(id: string) {
    const res = await client.api.todos[':id'].$get({ param: { id } });

    if (!res.ok) {
      await handleApiError(res, 'Failed to get todo');
    }

    return await res.json();
  },

  async getForUser(userId: string, queryParams?: UserTodosGetQueryParams) {
    const res = await client.api.users[':userId'].todos.$get({
      param: { userId },
      query: queryParams || {},
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to get user todos');
    }

    return await res.json();
  },

  async create(todo: TodosPostJsonBody) {
    const res = await client.api.todos.$post({
      json: todo,
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to create todo');
    }

    return await res.json();
  },

  async update(id: string, changes: TodoPutJsonBody) {
    const res = await client.api.todos[':id'].$put({
      param: { id },
      json: changes,
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to update todo');
    }

    return await res.json();
  },

  async delete(id: string) {
    const res = await client.api.todos[':id'].$delete({
      param: { id },
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to delete todo');
    }

    return { success: true };
  },

  async deleteAllForUser(userId: string) {
    const res = await client.api.users[':userId'].todos.$delete({
      param: { userId },
    });

    if (!res.ok) {
      await handleApiError(res, 'Failed to delete all todos');
    }

    return await res.json();
  },
};

export const getSortParamsFromStorage = () => {
  try {
    const stored = localStorage.getItem(SORT_PARAMS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SORT_PARAMS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to parse sort parameters from localStorage:', error);
  }
  return DEFAULT_SORT_PARAMS;
};

export const updateSortParams = (newParams: Partial<typeof DEFAULT_SORT_PARAMS>) => {
  const currentParams = getSortParamsFromStorage();
  const updatedParams = { ...currentParams, ...newParams };

  localStorage.setItem(SORT_PARAMS_KEY, JSON.stringify(updatedParams));
  window.dispatchEvent(new CustomEvent('todoSortParamsChanged'));
};

export const resetSortParams = () => {
  localStorage.setItem(SORT_PARAMS_KEY, JSON.stringify(DEFAULT_SORT_PARAMS));
  window.dispatchEvent(new CustomEvent('todoSortParamsChanged'));
};

export const isApiError = (error: unknown): error is TodoApiError => error instanceof TodoApiError;

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const getErrorCode = (error: unknown): string | undefined => {
  if (isApiError(error)) {
    return error.code;
  }
  return undefined;
};

export const handleCommonErrors = (error: TodoApiError): string => {
  switch (error.code) {
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    case 'UNIQUE_CONSTRAINT_FAILED':
      return 'This resource already exists.';
    case 'VALIDATION_ERROR':
      return 'The provided data is invalid.';
    case 'DATABASE_ERROR':
      return 'A database error occurred. Please try again.';
    case 'FOREIGN_KEY_CONSTRAINT_FAILED':
      return 'Cannot perform this action due to related data.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};
