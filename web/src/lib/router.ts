import { createRouter } from '@tanstack/react-router';
import {
  ErrorComponent,
  NotFoundComponent,
  PendingComponent,
} from '../components/router-components';
import { routeTree } from '../routeTree.gen';

/**
 * Router configuration with best practices
 */
export const router = createRouter({
  routeTree,
  // Preload routes on hover/focus for better UX
  defaultPreload: 'intent',
  // Don't cache preloaded data
  defaultPreloadStaleTime: 0,
  // Default error component
  defaultErrorComponent: ErrorComponent,
  // Default pending component
  defaultPendingComponent: PendingComponent,
  // Default 404 component
  defaultNotFoundComponent: NotFoundComponent,
  // Context for all routes
  context: {
    // Add any global context here
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
