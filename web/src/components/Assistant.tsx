import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { McpProvider } from '@mcp-b/mcp-react-hooks';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  AssistantClient,
  AssistantTransport,
  BlogPostClient,
  BlogPostTransport,
  SidebarClient,
  SidebarTransport,
} from '../services/MCP';
import Todos from '../Todos';
import { AppSidebar } from './app-sidebar';
import { Thread } from './assistant-ui/thread';
import BlogPost from './BlogPost';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar';

interface AssistantProps {
  activeView: 'threads' | 'mcp';
  tab: 'assistant' | 'tutorial';
}

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: '/api/chat',
  });

  const navigate = useNavigate({ from: '/' });
  const search = useSearch({ from: '/' });

  const activeView = search.activeView;
  const currentTab = search.tab;

  const setActiveView = (newActiveView: 'threads' | 'mcp') => {
    navigate({
      search: (prev) => ({
        ...prev,
        activeView: newActiveView,
      }),
    });
  };

  const setCurrentTab = (newTab: string) => {
    if (newTab === 'assistant' || newTab === 'tutorial') {
      navigate({
        search: (prev) => ({
          ...prev,
          tab: newTab,
        }),
      });
    }
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider
        style={
          {
            '--sidebar-width': activeView === 'mcp' ? '24rem' : '16rem',
            '--sidebar-width-mobile': activeView === 'mcp' ? '24rem' : '18rem',
          } as React.CSSProperties
        }
      >
        <McpProvider client={SidebarClient} transport={SidebarTransport}>
          <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        </McpProvider>
        <SidebarInset className="transition-all duration-300">
          <div className="flex h-screen">
            <div className="flex-1 overflow-hidden relative">
              {currentTab === 'tutorial' && (
                <button
                  onClick={() => setCurrentTab('assistant')}
                  className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-background/95 backdrop-blur border hover:bg-accent transition-colors"
                  aria-label="Back to chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {currentTab === 'assistant' ? (
                <McpProvider client={AssistantClient} transport={AssistantTransport}>
                  <Thread />
                </McpProvider>
              ) : (
                <div className="h-full overflow-auto">
                  <McpProvider client={BlogPostClient} transport={BlogPostTransport}>
                    <BlogPost />
                  </McpProvider>
                </div>
              )}
            </div>
            <div className="w-96 border-l bg-gradient-to-b from-background to-background/80">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <h2 className="font-semibold text-lg">Tasks</h2>
                  </div>
                  {currentTab === 'assistant' && (
                    <button
                      onClick={() => setCurrentTab('tutorial')}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Learn mcp-b
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <Todos />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
