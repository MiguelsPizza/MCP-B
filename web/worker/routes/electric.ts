import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Electric SQL proxy route handler
 * Provides secure access to Electric Cloud API through a proxy endpoint
 * This prevents exposing sensitive credentials to the client
 */
const electric = new Hono<{ Bindings: Env }>()

  /**
   * GET /v1/shape
   * Electric SQL proxy endpoint for secure access to Electric Cloud
   * Forwards all client query parameters to Electric Cloud while adding
   * the necessary source credentials from environment variables
   */
  .get('/v1/shape', async (c) => {
    // Get all query parameters from the client request
    const url = new URL(c.req.url);
    const params = url.searchParams;

    // Construct the Electric Cloud URL
    const electricUrl = new URL('/v1/shape', 'https://api.electric-sql.cloud');

    // Forward all client parameters to Electric
    params.forEach((value, key) => {
      electricUrl.searchParams.set(key, value);
    });

    // Add the source credentials (these should be in environment variables)
    electricUrl.searchParams.set('source_id', c.env.ELECTRIC_SOURCE_ID);
    electricUrl.searchParams.set('source_secret', c.env.ELECTRIC_SOURCE_SECRET);

    try {
      // Proxy the request to Electric Cloud
      const response = await fetch(electricUrl.toString(), {
        method: 'GET',
        headers: {
          // Forward relevant headers from the client
          ...Object.fromEntries(
            Object.entries(c.req.header()).filter(([key]) =>
              ['accept', 'accept-encoding', 'user-agent'].includes(key.toLowerCase())
            )
          ),
        },
      });

      // Handle the response
      if (!response.ok) {
        console.error('Electric API error:', response.status, response.statusText);
        return c.json(
          {
            error: 'Electric API error',
            status: response.status,
            message: response.statusText,
          },
          response.status as ContentfulStatusCode
        );
      }

      // Create response with proper headers
      const headers = new Headers(response.headers);

      // Remove problematic headers that can cause issues with streaming
      headers.delete('content-encoding');
      headers.delete('content-length');

      // Add CORS headers if needed
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Electric proxy error:', error);
      return c.json(
        {
          error: 'Proxy error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  })

  /**
   * OPTIONS /v1/shape
   * Handle preflight requests for CORS
   */
  .options(
    '/v1/shape',
    () =>
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
  );

export default electric;
