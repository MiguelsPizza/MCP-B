import { TooltipIconButton } from '@/entrypoints/sidepanel/components/assistant-ui/tooltip-icon-button';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { cn } from '@/entrypoints/sidepanel/lib/utils';
import { ThreadListItemPrimitive, ThreadListPrimitive } from '@assistant-ui/react';
import { useNavigate } from '@tanstack/react-router';
import { ArchiveIcon, MessageSquareIcon, PlusIcon } from 'lucide-react';
import type { FC } from 'react';

interface ThreadListProps {
  className?: string;
  onThreadSelect?: () => void;
}

export const ThreadList: FC<ThreadListProps> = ({ className, onThreadSelect }) => {
  const navigate = useNavigate();

  return (
    <ThreadListPrimitive.Root className={cn('flex flex-col gap-1', className)}>
      <ThreadListNew onThreadSelect={onThreadSelect} />
      <ThreadListItems onThreadSelect={onThreadSelect} />
    </ThreadListPrimitive.Root>
  );
};

interface ThreadListNewProps {
  onThreadSelect?: () => void;
}

const ThreadListNew: FC<ThreadListNewProps> = ({ onThreadSelect }) => (
  <ThreadListPrimitive.New asChild>
    <Button
      className="data-[active]:bg-primary/10 data-[active]:border-primary/20 hover:bg-primary/5 hover:border-primary/10 flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-start h-auto border-2 border-dashed border-muted-foreground/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-3"
      variant="ghost"
      size="sm"
      onClick={onThreadSelect}
    >
      <div className="rounded-lg bg-primary/10 p-1.5">
        <PlusIcon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium">Start New Conversation</span>
    </Button>
  </ThreadListPrimitive.New>
);

interface ThreadListItemsProps {
  onThreadSelect?: () => void;
}

const ThreadListItems: FC<ThreadListItemsProps> = ({ onThreadSelect }) => (
  <ThreadListPrimitive.Items
    components={{
      ThreadListItem: () => <ThreadListItem onThreadSelect={onThreadSelect} />,
    }}
  />
);

interface ThreadListItemProps {
  onThreadSelect?: () => void;
}

const ThreadListItem: FC<ThreadListItemProps> = ({ onThreadSelect }) => (
  <ThreadListItemPrimitive.Root className="data-[active]:bg-primary/10 data-[active]:border-primary/30 data-[active]:shadow-sm hover:bg-muted/80 focus-visible:bg-muted focus-visible:ring-ring group flex items-center gap-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 border border-transparent hover:border-border/50 hover:shadow-sm hover:translate-x-0.5 active:translate-x-0 mb-1.5">
    <ThreadListItemPrimitive.Trigger
      className="flex-grow flex items-center gap-3 px-4 py-3 text-start"
      onClick={onThreadSelect}
    >
      <div className="rounded-lg bg-muted p-2 group-hover:bg-primary/10 transition-colors duration-200">
        <MessageSquareIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
      </div>
      <ThreadListItemTitle />
    </ThreadListItemPrimitive.Trigger>
    <ThreadListItemArchive />
  </ThreadListItemPrimitive.Root>
);

const ThreadListItemTitle: FC = () => (
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </p>
    <p className="text-xs text-muted-foreground mt-0.5">Just now</p>
  </div>
);

const ThreadListItemArchive: FC = () => (
  <ThreadListItemPrimitive.Archive asChild>
    <TooltipIconButton
      className="hover:text-destructive hover:bg-destructive/10 text-muted-foreground opacity-0 group-hover:opacity-100 mr-3 h-8 w-8 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
      variant="ghost"
      tooltip="Archive thread"
      // @ts-expect-error - size is not a valid prop for TooltipIconButton
      size="xs"
    >
      <ArchiveIcon className="h-4 w-4" />
    </TooltipIconButton>
  </ThreadListItemPrimitive.Archive>
);
