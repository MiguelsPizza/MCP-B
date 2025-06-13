import { HTTPException } from 'hono/http-exception';
import type { ErrorResponse } from '../db/schema';

/**
 * Custom error class for application-specific errors
 * Extends HTTPException to provide consistent error handling
 */
export class AppError extends HTTPException {
  constructor(status: number, message: string, code?: string, cause?: unknown) {
    const errorResponse: ErrorResponse = {
      error: message,
      message,
      code: code || 'INTERNAL_ERROR',
    };

    super(status as any, {
      message: JSON.stringify(errorResponse),
      cause,
    });
  }
}

/**
 * Database constraint error - thrown when unique constraints are violated
 */
export class UniqueConstraintError extends AppError {
  constructor(message: string = 'Resource already exists', cause?: unknown) {
    super(409, message, 'UNIQUE_CONSTRAINT_FAILED', cause);
  }
}

/**
 * Foreign key constraint error - thrown when referenced resources don't exist
 */
export class ForeignKeyConstraintError extends AppError {
  constructor(message: string = 'Referenced resource does not exist', cause?: unknown) {
    super(400, message, 'FOREIGN_KEY_CONSTRAINT_FAILED', cause);
  }
}

/**
 * Not found error - thrown when requested resources don't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', cause?: unknown) {
    super(404, message, 'NOT_FOUND', cause);
  }
}

/**
 * Validation error - thrown when request validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', cause?: unknown) {
    super(400, message, 'VALIDATION_ERROR', cause);
  }
}

/**
 * Database error - thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', cause?: unknown) {
    super(500, message, 'DATABASE_ERROR', cause);
  }
}

/**
 * Analyzes database errors and throws appropriate custom errors
 * @param error - The database error to analyze
 * @param defaultMessage - Default error message if no specific handling applies
 */
export const handleDatabaseError = (error: unknown, defaultMessage: string): never => {
  console.error('Database Error:', error);

  // Type guard for objects with message property
  const hasMessage = (err: unknown): err is { message: string } =>
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as any).message === 'string';

  const message = hasMessage(error) ? error.message : 'An unexpected error occurred';

  // Handle specific database constraint violations
  if (message.includes('UNIQUE constraint failed')) {
    throw new UniqueConstraintError('Resource already exists', error);
  }

  if (message.includes('FOREIGN KEY constraint failed')) {
    throw new ForeignKeyConstraintError('Referenced resource does not exist', error);
  }

  // Default to database error
  throw new DatabaseError(defaultMessage, error);
};

/**
 * Global error handler for the Hono application
 * Handles HTTPException and other errors consistently
 */
export const globalErrorHandler = (err: Error, c: any) => {
  console.error('Global Error Handler:', err);

  if (err instanceof HTTPException) {
    // Handle our custom errors and standard HTTPExceptions
    // const response = err.getResponse();

    // Try to parse our custom error format
    try {
      const errorData = JSON.parse(err.message);
      return c.json(errorData, err.status);
    } catch {
      // Fallback for standard HTTPExceptions
      return c.json(
        {
          error: 'HTTP Exception',
          message: err.message,
          code: 'HTTP_EXCEPTION',
        },
        err.status
      );
    }
  }

  // Handle unexpected errors
  return c.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
    500
  );
};
