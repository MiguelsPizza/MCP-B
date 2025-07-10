import { MarkdownText } from '@/entrypoints/sidepanel/components/assistant-ui/markdown-text';
import { TooltipIconButton } from '@/entrypoints/sidepanel/components/assistant-ui/tooltip-icon-button';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/entrypoints/sidepanel/components/ui/collapsible';
import { useAssistantMCP } from '@/entrypoints/sidepanel/hooks/useAssistantMCP';
import { cn } from '@/entrypoints/sidepanel/lib/utils';
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useThreadListItem,
} from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import {
  ArrowDownIcon,
  Bot,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { McpToolUIRenderer } from './McpToolUIRenderer';
import { ToolFallback } from './tool-fallback';

export const Thread: FC = () => {
  const { client, tools, isLoading, error, isConnected, capabilities, resources } = useMcpClient();
  const threadId = useThreadListItem((t) => t.id);

  useAssistantMCP(tools, client, threadId);

  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{}}
    >
      <ThreadPrimitive.Viewport className="flex flex-1 flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-2 pt-4">
        <ThreadWelcome />
        <McpToolUIRenderer tools={tools} />

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>
        <ThreadPrimitive.If empty>{/* <ThreadWelcomeSuggestions /> */}</ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <div className="relative px-3 pb-3 pt-2">
        <ThreadScrollToBottom />
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <TooltipIconButton
      tooltip="Scroll to bottom"
      variant="outline"
      className="absolute -top-10 right-4 rounded-full disabled:invisible z-10"
    >
      <ArrowDownIcon />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

const ThreadWelcome: FC = () => (
  <ThreadPrimitive.Empty>
    <div className="flex w-full flex-grow flex-col items-center justify-center text-center px-3">
      <div className="mb-4 p-3 bg-primary/5 rounded-xl">
        <svg
          className="w-10 h-10 mx-auto text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2">MCP-B Assistant</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        AI-powered browser automation with secure MCP integration
      </p>
      <div className="mt-4 px-3 py-2 border border-border/50 rounded-lg bg-card/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span>MCP active</span>
        </div>
      </div>
    </div>
  </ThreadPrimitive.Empty>
);

const ThreadWelcomeSuggestions: FC = () => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const toolPrompts: Record<string, { prompt: string; autoSend: boolean; description?: string }> = {
    createTodo: {
      prompt: 'Create a new todo: ',
      autoSend: false,
      description: 'Add a new task',
    },
    getTodos: {
      prompt: 'Show me all my todos',
      autoSend: true,
      description: 'View all tasks',
    },
    updateTodo: {
      prompt: 'Update todo ',
      autoSend: false,
      description: 'Modify an existing task',
    },
    deleteTodo: {
      prompt: 'Delete todo ',
      autoSend: false,
      description: 'Remove a specific task',
    },
    deleteAllTodos: {
      prompt: 'Delete all my todos',
      autoSend: true,
      description: 'Clear all tasks',
    },
    getTodo: {
      prompt: 'Get todo details for ',
      autoSend: false,
      description: 'View task details',
    },
    setSortCriteria: {
      prompt: 'Sort my todos by ',
      autoSend: false,
      description: 'Change sort order',
    },
    getSortCriteria: {
      prompt: 'Show me the current sort criteria',
      autoSend: true,
      description: 'View current sorting',
    },
    resetSortCriteria: {
      prompt: 'Reset sort criteria to defaults',
      autoSend: true,
      description: 'Reset to default sorting',
    },
  };

  return (
    <div className="mt-3 flex w-full flex-col items-center gap-3 max-w-2xl">
      <p className="text-sm text-muted-foreground font-medium">Try these commands:</p>

      {/* Primary quick action buttons */}
      <div className="flex w-full items-stretch justify-center gap-3">
        <ThreadPrimitive.Suggestion
          className="group hover:bg-primary/10 hover:border-primary/30 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-xl border border-border/50 p-4 transition-all ease-out hover:scale-[1.02] hover:shadow-md bg-card/30"
          prompt="Create a new todo: Buy groceries"
          method="replace"
          autoSend
        >
          <svg
            className="w-5 h-5 mb-2 text-primary group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Create a todo</span>
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion
          className="group hover:bg-primary/10 hover:border-primary/30 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-xl border border-border/50 p-4 transition-all ease-out hover:scale-[1.02] hover:shadow-md bg-card/30"
          prompt="Show me all my todos"
          method="replace"
          autoSend
        >
          <svg
            className="w-5 h-5 mb-2 text-primary group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-sm font-medium">View all todos</span>
        </ThreadPrimitive.Suggestion>
      </div>

      {/* Collapsible section for all available tools */}
      <Collapsible open={isToolsOpen} onOpenChange={setIsToolsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
          >
            <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <span>View all {Object.keys(toolPrompts).length} MCP tools</span>
            <ChevronDownIcon
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isToolsOpen && 'rotate-180'
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {Object.entries(toolPrompts).map(([tool, config]) => (
              <ThreadPrimitive.Suggestion
                key={tool}
                className="hover:bg-muted/80 flex flex-col items-start justify-start rounded-lg border p-3 transition-colors ease-in cursor-pointer"
                prompt={config.prompt}
                method="replace"
                autoSend={config.autoSend}
              >
                <span className="font-medium text-sm">{tool}</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {config.description || config.description || 'Run this tool'}
                </span>
              </ThreadPrimitive.Suggestion>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const Composer: FC = () => (
  <ComposerPrimitive.Root className="focus-within:border-primary/50 flex w-full flex-wrap items-end rounded-xl border bg-card/50 backdrop-blur-sm px-2 shadow-sm transition-all ease-in">
    <ComposerPrimitive.Input
      rows={1}
      autoFocus
      placeholder="Ask about todos or try the MCP tools..."
      className="placeholder:text-muted-foreground max-h-32 flex-grow resize-none border-none bg-transparent px-2 py-3 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
    />
    <ComposerAction />
  </ComposerPrimitive.Root>
);

const ComposerAction: FC = () => (
  <>
    <ThreadPrimitive.If running={false}>
      <ComposerPrimitive.Send asChild>
        <TooltipIconButton
          tooltip="Send"
          variant="default"
          className="my-2.5 size-8 p-2 transition-opacity ease-in"
        >
          <SendHorizontalIcon />
        </TooltipIconButton>
      </ComposerPrimitive.Send>
    </ThreadPrimitive.If>
    <ThreadPrimitive.If running>
      <ComposerPrimitive.Cancel asChild>
        <TooltipIconButton
          tooltip="Cancel"
          variant="default"
          className="my-2.5 size-8 p-2 transition-opacity ease-in"
        >
          <CircleStopIcon />
        </TooltipIconButton>
      </ComposerPrimitive.Cancel>
    </ThreadPrimitive.If>
  </>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root className="relative w-full max-w-[var(--thread-max-width)] py-3">
    <UserActionBar />

    <div className="bg-primary/10 text-foreground max-w-[calc(var(--thread-max-width)*0.9)] ml-auto break-words rounded-xl px-4 py-3 border border-primary/20">
      <MessagePrimitive.Content />
    </div>

    <BranchPicker className="mt-1 -mr-1 justify-end" />
  </MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="flex items-center gap-1 absolute -top-1 right-1"
  >
    <ActionBarPrimitive.Edit asChild>
      <TooltipIconButton tooltip="Edit" size="sm" className="h-6 w-6">
        <PencilIcon className="h-3 w-3" />
      </TooltipIconButton>
    </ActionBarPrimitive.Edit>
  </ActionBarPrimitive.Root>
);

const EditComposer: FC = () => (
  <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
    <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

    <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
      <ComposerPrimitive.Cancel asChild>
        <Button variant="ghost">Cancel</Button>
      </ComposerPrimitive.Cancel>
      <ComposerPrimitive.Send asChild>
        <Button>Send</Button>
      </ComposerPrimitive.Send>
    </div>
  </ComposerPrimitive.Root>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root className="relative w-full max-w-[var(--thread-max-width)] py-3">
    <MessagePrimitive.Content
      components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }}
    />

    <AssistantActionBar />

    <BranchPicker className="mt-1 -ml-1" />
  </MessagePrimitive.Root>
);

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    autohideFloat="single-branch"
    className="text-muted-foreground flex gap-1 absolute -top-1 left-1 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
  >
    <ActionBarPrimitive.Copy asChild>
      <TooltipIconButton tooltip="Copy" size="sm" className="h-6 w-6">
        <MessagePrimitive.If copied>
          <CheckIcon className="h-3 w-3" />
        </MessagePrimitive.If>
        <MessagePrimitive.If copied={false}>
          <CopyIcon className="h-3 w-3" />
        </MessagePrimitive.If>
      </TooltipIconButton>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Refresh" size="sm" className="h-6 w-6">
        <RefreshCwIcon className="h-3 w-3" />
      </TooltipIconButton>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
);

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={cn('text-muted-foreground inline-flex items-center text-xs', className)}
    {...rest}
  >
    <BranchPickerPrimitive.Previous asChild>
      <TooltipIconButton tooltip="Previous">
        <ChevronLeftIcon />
      </TooltipIconButton>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <TooltipIconButton tooltip="Next">
        <ChevronRightIcon />
      </TooltipIconButton>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);

const CircleStopIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    width="16"
    height="16"
  >
    <rect width="10" height="10" x="3" y="3" rx="2" />
  </svg>
);
