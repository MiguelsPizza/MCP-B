import { ChevronDown, Clock, Package, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AutoForm } from '../ui/autoform';
import { Badge } from '../ui/badge';
import type { InputSchema, ToolCardProps } from './types';
import { getDefaultValues, parseToolInfo } from './utils';

export function ToolCard({
  tool,
  isExpanded,
  onToggle,
  onCall,
  isCalling,
  schema,
}: ToolCardProps): React.ReactElement {
  const hasParameters =
    tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0;

  // Parse tool info for cleaner display
  const { cleanName, domain, isActive, tabIndex, isCached } = parseToolInfo(
    tool.name,
    tool.description
  );

  // Clean up the description by removing domain prefix
  const cleanDescription = tool.description?.replace(/^\[[^\]]+\]\s*/, '') || '';

  const handleSubmit = (data: Record<string, unknown>) => {
    onCall(tool.name, data);
  };

  return (
    <div
      className={cn(
        'rounded-md border bg-card overflow-hidden',
        isActive
          ? 'border-green-500/50 shadow-sm'
          : isCached
            ? 'border-orange-500/30'
            : 'border-border/50'
      )}
    >
      <div
        className="px-2 py-1.5 cursor-pointer hover:bg-muted/30 transition-colors flex items-center justify-between gap-1.5"
        onClick={onToggle}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isCached ? (
            <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          ) : (
            <Package
              className={cn(
                'h-3 w-3 flex-shrink-0',
                isActive ? 'text-green-500' : 'text-muted-foreground'
              )}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate">{cleanName}</span>
              {!hasParameters && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                  No params
                </Badge>
              )}
            </div>
            {cleanDescription && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {cleanDescription}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform duration-200',
            !isExpanded && '-rotate-90'
          )}
        />
      </div>

      {isExpanded && (
        <div className="px-2 pb-2 pt-1 border-t border-border/50">
          {schema && hasParameters ? (
            <AutoForm
              schema={schema}
              onSubmit={handleSubmit}
              defaultValues={getDefaultValues(tool.inputSchema as InputSchema)}
            >
              <button
                type="submit"
                disabled={isCalling}
                className={cn(
                  'w-full h-6 text-[11px] font-medium rounded-md transition-colors mt-2',
                  'inline-flex items-center justify-center',
                  isCalling
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isCalling ? (
                  <>
                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1.5" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-2.5 w-2.5 mr-1.5" />
                    <span>Execute</span>
                  </>
                )}
              </button>
            </AutoForm>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit({})}
              disabled={isCalling}
              className={cn(
                'w-full h-6 text-[11px] font-medium rounded-md transition-colors',
                'inline-flex items-center justify-center',
                isCalling
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {isCalling ? (
                <>
                  <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1.5" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="h-2.5 w-2.5 mr-1.5" />
                  <span>Execute</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
