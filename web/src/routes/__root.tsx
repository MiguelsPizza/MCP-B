import { QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { McpToolsProvider } from '@/hooks/McpToolsProvider';
import { Toaster } from '../components/ui/sonner';
import { queryClient } from '../lib/utils';

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  pendingComponent: RootPendingComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Home
        </a>
      </div>
    </div>
  ),
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <McpToolsProvider>
        <div className="w-full h-screen">
          <Outlet />
          <Toaster />
        </div>
        {/* {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />} */}
      </McpToolsProvider>
    </QueryClientProvider>
  );
}

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-destructive/10 p-6">
        <h2 className="mb-2 text-2xl font-semibold text-destructive">Application Error</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{error.stack}</pre>
        </details>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}

function RootPendingComponent() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
