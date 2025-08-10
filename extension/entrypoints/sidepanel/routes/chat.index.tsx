import { Thread } from '@/entrypoints/sidepanel/components/assistant-ui/thread';
import { ThreadList } from '@/entrypoints/sidepanel/components/assistant-ui/thread-list';
import { ToolSelector } from '@/entrypoints/sidepanel/components/tool-selector';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute } from '@tanstack/react-router';
import {
  BrainCircuitIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  MenuIcon,
  Settings2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { client, transport } from '../lib/client';
import { config } from '../lib/config';

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isToolSelectorOpen, setIsToolSelectorOpen] = useState(false);
  const runtime = useChatRuntime({
    api: "http://localhost:5173/api/chat",
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
            <div className="toolbar-surface">
              <div className="toolbar-inner">
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
            <div className="toolbar-surface">
              <div className="toolbar-inner">
                <div className="toolbar-group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-toolbar-primary"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <MenuIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Threads</span>
                  </Button>

                  <div className="w-px h-6 bg-border/50 mx-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-toolbar-icon-primary"
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

                <div className="toolbar-group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-toolbar-icon-secondary"
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
