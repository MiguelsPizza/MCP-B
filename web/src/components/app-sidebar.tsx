import * as React from 'react';
import { Github, MessagesSquare, Server } from 'lucide-react';
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView: 'threads' | 'mcp';
  setActiveView: (view: 'threads' | 'mcp') => void;
}

export function AppSidebar({ activeView, setActiveView, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props} className="transition-all duration-300">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <a
                href="https://github.com/alxnahas/mcp-b"
                target="_blank"
                className="flex items-center gap-2"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">mcp-b</span>
                  <span className="text-xs text-muted-foreground">Browser MCP</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* View Toggle */}
        <div className="px-2 py-2">
          <div className="flex gap-1 p-1 bg-sidebar-accent/50 rounded-lg">
            <Button
              variant={activeView === 'threads' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('threads')}
              className="flex-1 h-7 text-xs"
            >
              <MessagesSquare className="h-3 w-3 mr-1" />
              Threads
            </Button>
            <Button
              variant={activeView === 'mcp' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('mcp')}
              className="flex-1 h-7 text-xs"
            >
              <Server className="h-3 w-3 mr-1" />
              MCP
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>{activeView === 'threads' ? <ThreadList /> : <McpServer />}</SidebarContent>

      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <a
                href="https://github.com/alxnahas/mcp-b"
                target="_blank"
                className="flex items-center gap-2"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Github className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">GitHub</span>
                  <span className="">View mcp-b Source</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
