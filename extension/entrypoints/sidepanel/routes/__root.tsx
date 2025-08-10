import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { AlertCircle, FileCode, FileQuestion, MessageSquare, Server, Sparkles } from 'lucide-react';
import { Toaster } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';

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
        <header className="toolbar-surface-top relative overflow-hidden">
          {/* animated gradient beam at the bottom border */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-violet-500/30 via-sky-500/30 to-fuchsia-500/30 [background-size:200%_100%] animate-gradient-x" />

          {/* subtle ambient glow behind brand */}
          <div className="pointer-events-none absolute -top-24 -left-20 h-48 w-72 rounded-full bg-[radial-gradient(40%_60%_at_30%_50%,theme(colors.violet.500/20),transparent)] blur-2xl" />

          <div className="toolbar-inner px-4 relative gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 via-sky-500/20 to-fuchsia-500/20 border border-border/60 shadow-sm">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight gradient-text">WebMCP</span>
                <Badge variant="secondary" className="h-5 text-[10px] px-1.5 hidden md:inline-flex">
                  Beta
                </Badge>
              </div>
            </div>

            <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="group relative overflow-hidden rounded-md shrink-0"
                  >
                    <Link
                      to="/chat"
                      aria-label="Chat"
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary [&[aria-current=page]]:text-primary [&.active]:text-primary"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Chat</span>
                      <span className="nav-underline pointer-events-none absolute inset-x-2 bottom-1 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="group relative overflow-hidden rounded-md shrink-0"
                  >
                    <Link
                      to="/mcp"
                      aria-label="MCP Server"
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary [&[aria-current=page]]:text-primary [&.active]:text-primary"
                    >
                      <Server className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">MCP Server</span>
                      <span className="nav-underline pointer-events-none absolute inset-x-2 bottom-1 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">MCP Server</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="group relative overflow-hidden rounded-md shrink-0"
                  >
                    <Link
                      to="/userscripts"
                      aria-label="UserScripts"
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary [&[aria-current=page]]:text-primary [&.active]:text-primary"
                    >
                      <FileCode className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">UserScripts</span>
                      <span className="nav-underline pointer-events-none absolute inset-x-2 bottom-1 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">UserScripts</TooltipContent>
              </Tooltip>
            </nav>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </>
  );
}
