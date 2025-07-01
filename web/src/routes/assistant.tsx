import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { AppSidebar } from '../components/app-sidebar';
import { AppSidebarMobile } from '../components/app-sidebar-mobile';
import { Thread } from '../components/assistant-ui/thread';
import { PageHeader } from '../components/PageHeader';
import Todos from '../components/Todos';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MessageSquare, ListTodo, Server } from 'lucide-react';
import { indexSearchSchema } from '../paramSchemas';
import { useIsMobile } from '../hooks/use-mobile';
import {
  AssistantClient,
  AssistantTransport,
  SidebarClient,
  SidebarTransport,
} from '../services/MCP';

const Assistant = () => {
  const runtime = useChatRuntime({
    api: 'api/chat',
  });

  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const isMobile = useIsMobile();

  const activeView = search.activeView || 'threads';

  const setActiveView = (newActiveView: 'threads' | 'mcp' | 'todos') => {
    navigate({
      search: {
        ...search,
        activeView: newActiveView,
      },
    });
  };

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="h-[100dvh] relative bg-background flex flex-col">
        <AssistantRuntimeProvider runtime={runtime}>
          <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
            <TabsContent value="chat" className="flex-1 m-0 p-0 overflow-hidden">
              <McpClientProvider client={AssistantClient} transport={AssistantTransport} opts={{}}>
                <Thread />
              </McpClientProvider>
            </TabsContent>
            <TabsContent value="tasks" className="flex-1 m-0 p-0 overflow-hidden">
              <div className="h-full flex flex-col bg-gradient-to-b from-card to-card/80">
                <div className="p-4 border-b border-border bg-muted/50">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Tasks
                  </h2>
                </div>
                <div className="flex-1 overflow-auto">
                  <Todos route="/assistant" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sidebar" className="flex-1 m-0 p-0 overflow-hidden">
              <McpClientProvider client={SidebarClient} transport={SidebarTransport} opts={{}}>
                <AppSidebarMobile activeView={activeView} setActiveView={setActiveView} />
              </McpClientProvider>
            </TabsContent>
            <TabsList className="h-14 w-full rounded-none border-t bg-background/95 backdrop-blur p-1 flex justify-between">
              <TabsTrigger
                value="chat"
                className="flex-1 flex flex-col gap-0.5 h-full py-2 rounded-lg data-[state=active]:bg-primary/10"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-[11px] font-medium">Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="flex-1 flex flex-col gap-0.5 h-full py-2 rounded-lg data-[state=active]:bg-primary/10 mx-1"
              >
                <ListTodo className="h-5 w-5" />
                <span className="text-[11px] font-medium">Tasks</span>
              </TabsTrigger>
              <TabsTrigger
                value="sidebar"
                className="flex-1 flex flex-col gap-0.5 h-full py-2 rounded-lg data-[state=active]:bg-primary/10"
              >
                <Server className="h-5 w-5" />
                <span className="text-[11px] font-medium">Menu</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </AssistantRuntimeProvider>
      </div>
    );
  }

  // Desktop layout (unchanged)
  return (
    <div className="min-h-screen relative bg-background">
      <div className="absolute top-10 sm:top-20 left-5 sm:left-10 h-36 sm:h-72 w-36 sm:w-72 bg-gradient-to-br from-chart-1/30 to-chart-2/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 h-48 sm:h-96 w-48 sm:w-96 bg-gradient-to-br from-chart-3/20 to-chart-4/20 rounded-full blur-3xl animate-float-delayed" />

      <AssistantRuntimeProvider runtime={runtime}>
        <SidebarProvider
          style={
            {
              '--sidebar-width': activeView === 'mcp' ? '24rem' : '16rem',
              '--sidebar-width-mobile': activeView === 'mcp' ? '24rem' : '18rem',
            } as React.CSSProperties
          }
        >
          <McpClientProvider client={SidebarClient} transport={SidebarTransport} opts={{}}>
            <AppSidebar activeView={activeView} setActiveView={setActiveView} />
          </McpClientProvider>
          <SidebarInset className="transition-all duration-300">
            <div className="flex flex-col lg:flex-row h-[100dvh] lg:h-[calc(100vh-20px)]">
              <div className="flex-1 overflow-hidden relative order-2 lg:order-1">
                <McpClientProvider
                  client={AssistantClient}
                  transport={AssistantTransport}
                  opts={{}}
                >
                  <Thread />
                </McpClientProvider>
              </div>
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-gradient-to-b from-card to-card/80 order-1 lg:order-2 h-40 lg:h-auto">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger className="lg:hidden" />
                      <h2 className="text-lg sm:text-xl font-bold lg:text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Tasks
                      </h2>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden bg-background/50">
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
