import { Github, MessagesSquare, Server } from 'lucide-react';
import * as React from 'react';
import { Button } from '../components/ui/button';
import { ThreadList } from './assistant-ui/thread-list';
import McpServer from './McpServer';

interface AppSidebarMobileProps {
  activeView: 'threads' | 'mcp' | 'todos';
  setActiveView: (view: 'threads' | 'mcp' | 'todos') => void;
}

export function AppSidebarMobile({ activeView, setActiveView }: AppSidebarMobileProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <a
          href={
            import.meta.env.DEV
              ? 'http://localhost:5173'
              : `${import.meta.env.VITE_APP_URL || window.location.origin}/`
          }
          className="flex items-center gap-3"
        >
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-base">MCP-B</span>
            <span className="text-xs text-muted-foreground">Browser MCP</span>
          </div>
        </a>

        {/* View Toggle */}
        <div className="mt-4 flex gap-2 p-1 bg-muted/50 rounded-lg">
          <Button
            variant={activeView === 'threads' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('threads')}
            className="flex-1 h-9"
          >
            <MessagesSquare className="h-4 w-4 mr-2" />
            Threads
          </Button>
          <Button
            variant={activeView === 'mcp' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('mcp')}
            className="flex-1 h-9"
          >
            <Server className="h-4 w-4 mr-2" />
            MCP
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'threads' ? <ThreadList /> : <McpServer />}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <a
          href="https://github.com/MiguelsPizza/WebMCP"
          target="_blank"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          rel="noopener"
        >
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-muted text-foreground">
            <Github className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-sm">GitHub</span>
            <span className="text-xs text-muted-foreground">View mcp-b Source</span>
          </div>
        </a>
      </div>
    </div>
  );
}
