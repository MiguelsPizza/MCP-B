import * as React from 'react';
import { Github, MessagesSquare, Server, ListTodo } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '../components/ui/sidebar';
import { ThreadList } from './assistant-ui/thread-list';
import McpServer from './McpServer';
import Todos from './Todos';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView: 'threads' | 'mcp' | 'todos';
  setActiveView: (view: 'threads' | 'mcp' | 'todos') => void;
}

export function AppSidebar({ activeView, setActiveView, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props} className="transition-all duration-300">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <a
                href={
                  import.meta.env.DEV
                    ? 'http://localhost:5173/'
                    : `${import.meta.env.VITE_APP_URL || window.location.origin}/`
                }
                className="flex items-center gap-2"
              >
                <div className="flex aspect-square size-10 sm:size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                  <svg className="size-5 sm:size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm sm:text-base">MCP-B</span>
                  <span className="text-xs text-muted-foreground">Browser MCP</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* View Toggle */}
        <div className="px-3 sm:px-2 py-2">
          <div className="flex gap-1 p-1.5 sm:p-1 bg-sidebar-accent/50 rounded-lg">
            <Button
              variant={activeView === 'threads' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('threads')}
              className="flex-1 h-10 sm:h-8 text-xs"
              title="Threads"
            >
              <MessagesSquare className="h-4 w-4 sm:h-3.5 sm:w-3.5 md:mr-0 mr-1" />
              <span className="md:hidden">Threads</span>
            </Button>
            <Button
              variant={activeView === 'todos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('todos')}
              className="flex-1 h-10 sm:h-8 text-xs lg:hidden"
              title="Tasks"
            >
              <ListTodo className="h-4 w-4 sm:h-3.5 sm:w-3.5 md:mr-0 mr-1" />
              <span className="md:hidden">Tasks</span>
            </Button>
            <Button
              variant={activeView === 'mcp' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('mcp')}
              className="flex-1 h-10 sm:h-8 text-xs"
              title="MCP"
            >
              <Server className="h-4 w-4 sm:h-3.5 sm:w-3.5 md:mr-0 mr-1" />
              <span className="md:hidden">MCP</span>
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {activeView === 'threads' ? (
          <ThreadList />
        ) : activeView === 'todos' ? (
          <div className="p-2">
            <Todos route="/assistant" />
          </div>
        ) : (
          <McpServer />
        )}
      </SidebarContent>

      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <a
                href="https://github.com/miguelspizza/mcp-b"
                target="_blank"
                className="flex items-center gap-2"
              >
                <div className="flex aspect-square size-10 sm:size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Github className="size-5 sm:size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm sm:text-base">GitHub</span>
                  <span className="text-xs sm:text-sm">View mcp-b Source</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
