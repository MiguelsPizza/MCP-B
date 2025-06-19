import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { McpProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { AppSidebar } from '../components/app-sidebar';
import { Thread } from '../components/assistant-ui/thread';
import { PageHeader } from '../components/PageHeader';
import Todos from '../components/Todos';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import { indexSearchSchema } from '../paramSchemas';
import {
  AssistantClient,
  AssistantTransport,
  SidebarClient,
  SidebarTransport,
} from '../services/MCP';

interface AssistantProps {
  activeView: 'threads' | 'mcp';
}

const Assistant = () => {
  const runtime = useChatRuntime({
    api: '/api/chat',
  });

  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const activeView = search.activeView || 'threads';

  const setActiveView = (newActiveView: 'threads' | 'mcp') => {
    navigate({
      search: (prev) => ({
        ...prev,
        activeView: newActiveView,
      }),
    });
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-20 left-10 h-72 w-72 bg-gradient-to-br from-primary/30 to-blue-600/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-20 right-10 h-96 w-96 bg-gradient-to-br from-blue-600/20 to-primary/20 rounded-full blur-3xl animate-float-delayed" />

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
            <div className="flex h-[calc(100vh-20px)]">
              <div className="flex-1 overflow-hidden relative">
                <McpProvider client={AssistantClient} transport={AssistantTransport}>
                  <Thread />
                </McpProvider>
              </div>
              <div className="w-96 border-l bg-gradient-to-b from-background to-background/80">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger className="lg:hidden" />
                      <h2 className="mb-4 text-xl font-bold sm:text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Tasks
                      </h2>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Todos route="/assistant" />
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    </div>
  );
};

export const Route = createFileRoute('/assistant')({
  component: Assistant,
  validateSearch: zodValidator(indexSearchSchema),
});
