import { Hono } from 'hono';
import { globalErrorHandler } from './lib/error-handler';
// Import route modules
import chat from './routes/chat';
import electric from './routes/electric';
import todos from './routes/todos';
import userTodos from './routes/user-todos';
import users from './routes/users';

/**
 * Main Hono application
 * Orchestrates all route modules and provides the main application structure
 */
const app = new Hono<{ Bindings: Env }>()
  // Uncomment to enable request logging
  // .use(logger())

  // Mount Electric SQL proxy routes
  .route('/', electric)

  // Mount chat routes
  .route('/', chat)

  // Mount API routes
  .route('/api/users', users)
  .route('/api/users', userTodos)
  .route('/api/todos', todos);

// Global error handler
app.onError(globalErrorHandler);

export default app;

export type AppType = typeof app;
