import { Badge } from '@/entrypoints/sidepanel/components/ui/badge';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { Card, CardContent, CardHeader } from '@/entrypoints/sidepanel/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/entrypoints/sidepanel/components/ui/tooltip';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, FileCode } from 'lucide-react';
import * as React from 'react';
import { trpc } from '../lib/trpc_client';

export const Route = createFileRoute('/userscripts/$scriptId')({
  component: UserScriptDetailPage,
});

function UserScriptDetailPage() {
  const { scriptId } = Route.useParams();
  const navigate = useNavigate();
  // Fetch script details from chrome.userScripts by id
  const { data: script, isLoading } = trpc.userScripts.getScript.useQuery({ id: scriptId });
  const [activeTab] = React.useState<'overview' | 'patterns'>('overview');

  if (isLoading) return null;

  if (!script) {
    return <div className="p-4">Script not found</div>;
  }

  return (
    <div className="p-2 flex flex-col h-full">
      {/* Header */}
      <div className="toolbar-surface-top mb-1">
        <div className="toolbar-inner px-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="btn-toolbar-icon-primary"
              onClick={() => navigate({ to: '/userscripts' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[60%]">
                  <FileCode className="h-4 w-4" />
                  <span className="text-sm font-medium truncate">{script.id}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{script.id}</TooltipContent>
            </Tooltip>
            <div className="ml-auto flex items-center gap-1" />
          </div>
        </div>
      </div>

      {/* Info Cards (Overview) */}
      {activeTab === 'overview' && script && (
        <div className="grid grid-cols-2 gap-1 mb-2">
          <Card className="px-2 py-1">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">World</div>
                <Badge variant="outline" className="text-xs">
                  {script.world ?? 'USER_SCRIPT'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">All Frames</div>
                <Badge variant={script.allFrames ? 'default' : 'secondary'} className="text-[10px]">
                  {script.allFrames ? 'Yes' : 'No'}
                </Badge>
              </div>
              {script.runAt && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Run At</div>
                  <span className="text-xs">{script.runAt}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Match Patterns */}
      {activeTab === 'patterns' && script && (
        <Card className="mb-2">
          <CardHeader className="py-1 px-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileCode className="h-3.5 w-3.5" />
              <span className="text-xs">Patterns</span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="space-y-1.5">
              <div>
                <div className="text-xs font-medium mb-1">Matches</div>
                <div className="flex flex-wrap gap-1.5">
                  {script.matches?.map((pattern, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
              {script.excludeMatches && script.excludeMatches.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Excludes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {script.excludeMatches.map((pattern, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex-grow overflow-hidden" />
    </div>
  );
}
