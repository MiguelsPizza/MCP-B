import { Thread } from '@/entrypoints/sidepanel/components/assistant-ui/thread';
import { ThreadList } from '@/entrypoints/sidepanel/components/assistant-ui/thread-list';
import { ToolSelector } from '@/entrypoints/sidepanel/components/tool-selector';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import {
  useChatRuntime
} from '@assistant-ui/react-ai-sdk';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute } from '@tanstack/react-router';
import {
  BrainCircuitIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  MenuIcon,
  Settings2Icon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { client, transport } from '../lib/client';
import { config } from '../lib/config';

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isToolSelectorOpen, setIsToolSelectorOpen] = useState(false);
  const runtime = useChatRuntime({
    api: "http://localhost:8787/api/chat",
    maxSteps: 100,
    onError: (error) => {
      if (config.features.enableDebugLogging) {
        console.error('[Chat] Error:', error);
      }
      throw error;
    },
  });

  // Allow other components to open the tool selector via a window event
  useEffect(() => {
    const handler = () => setIsToolSelectorOpen(true);
    window.addEventListener('open-tool-selector', handler as EventListener);
    return () => window.removeEventListener('open-tool-selector', handler as EventListener);
  }, []);

  return (
    <McpClientProvider client={client} transport={transport} opts={{}}>
      <AssistantRuntimeProvider runtime={runtime}>
        {isToolSelectorOpen ? (
          // Tool selector view
          <ToolSelector onClose={() => setIsToolSelectorOpen(false)} />
        ) : isSidebarOpen ? (
          // Thread list takes over entire sidepanel
          <div className="h-full bg-background flex flex-col">
            <div className="flex-1 overflow-hidden">
              <div className="p-4 overflow-y-auto h-full">
                <ThreadList onThreadSelect={() => setIsSidebarOpen(false)} />
              </div>
            </div>
            {/* Bottom bar aligned with toolbar */}
            <div className="border-t bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center justify-between px-3 py-2">
                <h2 className="font-semibold text-sm">Threads</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 flex items-center gap-2 hover:bg-primary/10 transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="text-xs font-medium">Back to Chat</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Chat view with toolbar
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <Thread />
            </div>
            {/* Enhanced Toolbar */}
            <div className="border-t bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-colors border border-primary/20"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <MenuIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Threads</span>
                  </Button>

                  <div className="w-px h-6 bg-border/50 mx-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 transition-colors border border-primary/30 shadow-sm"
                    onClick={() => setIsToolSelectorOpen(true)}
                    title="Select Tools"
                  >
                    <BrainCircuitIcon className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary/10 transition-colors"
                    disabled
                    title="Settings (Coming Soon)"
                  >
                    <Settings2Icon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-gradient-to-br from-secondary/10 to-secondary/20 hover:from-secondary/20 hover:to-secondary/30 transition-colors border border-secondary/30 shadow-sm"
                    disabled
                    title="Help (Coming Soon)"
                  >
                    <HelpCircleIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AssistantRuntimeProvider>
    </McpClientProvider>
  );
};

export const Route = createFileRoute('/chat/')({
  component: Chat,
});
