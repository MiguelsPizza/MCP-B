import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { AlertCircle, FileQuestion, MessageSquare, Server } from 'lucide-react';
import * as React from 'react';
import { Toaster } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';

export const Route = createRootRouteWithContext<any>()({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <Alert variant="destructive" className="max-w-md mb-4">
        <FileQuestion className="h-5 w-5 mr-2" />
        <AlertTitle>Page Not Found</AlertTitle>
        <AlertDescription>
          The page you're looking for doesn't exist or has been moved.
        </AlertDescription>
      </Alert>
      <Button asChild>
        <Link to="/chat">Return Home</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <Alert variant="destructive" className="max-w-md mb-4">
        <AlertCircle className="h-5 w-5 mr-2" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
      <Button asChild>
        <Link to="/chat">Return Home</Link>
      </Button>
    </div>
  ),
});

function RootComponent() {
  return (
    <>
      <div className="flex flex-col h-screen">
        <header className="border-b px-4 py-2">
          <nav className="flex gap-4">
            <Link
              to="/chat"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary [&.active]:text-primary"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
            <Link
              to="/mcp"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary [&.active]:text-primary"
            >
              <Server className="h-4 w-4" />
              MCP Server
            </Link>
          </nav>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </>
  );
}
