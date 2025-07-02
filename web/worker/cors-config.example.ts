import type { CorsOptions } from 'hono/cors';

/**
 * Example CORS configuration for production environments
 * Copy this file to cors-config.ts and customize for your needs
 */

// Development configuration (allows all origins)
export const devCorsConfig: CorsOptions = {
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
};

// Production configuration (restricts to specific origins)
export const prodCorsConfig: CorsOptions = {
  origin: (origin) => {
    // List of allowed origins
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://app.yourdomain.com',
      'https://localhost:3000', // For local development
    ];

    // Check if the origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      return origin || allowedOrigins[0];
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
};

// Environment-based configuration
export const getCorsConfig = (env: 'development' | 'production'): CorsOptions => {
  return env === 'production' ? prodCorsConfig : devCorsConfig;
};
