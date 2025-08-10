import { Env, Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import '../worker-configuration.d.ts';
// Import route modules
import chat from './routes/chat';

/**
 * Main Hono application
 * Orchestrates all route modules and provides the main application structure
 */
const app = new Hono<{ Bindings: Env }>()
  // Enable CORS for all routes
  .use(
    '*',
    cors({
      // TEMPORARY: Allow all origins for testing
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
      // Note: credentials cannot be true when origin is '*'
      credentials: false,
    })
  )
  .use(logger())
  .route('/api', chat);
export default app;

export type AppType = typeof app;
