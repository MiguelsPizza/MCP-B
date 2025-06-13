import type { FC } from 'react';
import { useEffect, useState } from 'react';
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
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
import { MarkdownText } from '../../components/assistant-ui/markdown-text';
import { TooltipIconButton } from '../../components/assistant-ui/tooltip-icon-button';
import { Button } from '../../components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { useAssistantMCP } from '../../hooks/useAssistantMCP';
import { cn } from '../../lib/utils';
import { McpToolUIRenderer } from './McpToolUIRenderer';
import { ToolFallback } from './tool-fallback';

export const Thread: FC = () => {
  const { client, tools, isLoading, error, isConnected, capabilities, connect, resources } =
    useMcpClient();

  // Connect on mount
  useEffect(() => {
    connect().catch((err) => {
      console.error('Failed to connect to MCP server:', err);
    });
  }, [connect]);

  useAssistantMCP(tools, client);

  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{
        ['--thread-max-width' as string]: '50rem',
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
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
        <ThreadWelcomeSuggestions />

        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <TooltipIconButton
      tooltip="Scroll to bottom"
      variant="outline"
      className="absolute -top-8 rounded-full disabled:invisible"
    >
      <ArrowDownIcon />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

const ThreadWelcome: FC = () => (
  <ThreadPrimitive.Empty>
    <div className="flex w-full max-w-lg flex-grow flex-col items-center justify-center text-center px-4">
      <div className="mb-6 p-4 bg-primary/5 rounded-2xl">
        <svg
          className="w-16 h-16 mx-auto text-primary"
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
      <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Welcome to mcp-b
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-md">
        Experience the power of Model Context Protocol running directly in your browser. No servers,
        no API keys – just secure, authenticated AI interactions.
      </p>
      <div className="mt-8 p-4 border border-border/50 rounded-xl bg-card/30">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>MCP server active and ready</span>
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
  <ComposerPrimitive.Root className="focus-within:border-primary/50 flex w-full flex-wrap items-end rounded-2xl border bg-card/50 backdrop-blur-sm px-3 shadow-lg transition-all ease-in hover:shadow-xl">
    <ComposerPrimitive.Input
      rows={1}
      autoFocus
      placeholder="Ask about todos or try the MCP tools..."
      className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
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
  <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
    <UserActionBar />

    <div className="bg-primary/10 text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-2xl px-5 py-3 col-start-2 row-start-2 border border-primary/20">
      <MessagePrimitive.Content />
    </div>

    <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
  </MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
  >
    <ActionBarPrimitive.Edit asChild>
      <TooltipIconButton tooltip="Edit">
        <PencilIcon />
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
  <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
    <div className="col-start-1 row-start-1 mr-3 mt-1.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
    <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
      <MessagePrimitive.Content
        components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }}
      />
    </div>

    <AssistantActionBar />

    <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
  </MessagePrimitive.Root>
);

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    autohideFloat="single-branch"
    className="text-muted-foreground flex gap-1 col-start-3 row-start-2 -ml-1 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
  >
    <ActionBarPrimitive.Copy asChild>
      <TooltipIconButton tooltip="Copy">
        <MessagePrimitive.If copied>
          <CheckIcon />
        </MessagePrimitive.If>
        <MessagePrimitive.If copied={false}>
          <CopyIcon />
        </MessagePrimitive.If>
      </TooltipIconButton>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Refresh">
        <RefreshCwIcon />
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
