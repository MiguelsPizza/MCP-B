import { TRPCError } from '@trpc/server';

export function getErrorFromUnknown(cause: unknown): TRPCError {
  if (cause instanceof Error) {
    if (cause.name === 'TRPCError') {
      return cause as TRPCError;
    }
    const error = new TRPCError({
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      cause: cause,
    });
    error.stack = cause.stack;
    return error;
  }
  return new TRPCError({
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
