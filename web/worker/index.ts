import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
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
      origin: (origin) => {
        // Production allowed origins
        const allowedOrigins = [
          'https://mcp-b.ai',
          'chrome-extension://daohopfhkdelnpemnhlekblhnikhdhfa',
        ];

        // Also allow localhost for local development
        if (
          origin &&
          (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
        ) {
          return origin;
        }

        // Return the origin if it's in the allowed list, otherwise return the first allowed origin
        // This ensures CORS headers are always set for allowed origins
        return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
      credentials: true,
    })
  )
  .use(logger())
  .route('/api', chat);
export default app;

export type AppType = typeof app;
