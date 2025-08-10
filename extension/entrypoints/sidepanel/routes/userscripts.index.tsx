import { Alert, AlertDescription, AlertTitle } from '@/entrypoints/sidepanel/components/ui/alert';
import { Badge } from '@/entrypoints/sidepanel/components/ui/badge';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { Card, CardContent, CardHeader } from '@/entrypoints/sidepanel/components/ui/card';
import { Input } from '@/entrypoints/sidepanel/components/ui/input';
import { ScrollArea } from '@/entrypoints/sidepanel/components/ui/scroll-area';
import { Skeleton } from '@/entrypoints/sidepanel/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/entrypoints/sidepanel/components/ui/tooltip';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, FileCode, Plus, Search, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc_client';

export const Route = createFileRoute('/userscripts/')({
  component: UserScriptsListPage,
});

function UserScriptsListPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  // Status filtering is not applicable with chrome.userScripts; only registered scripts are returned
  const navigate = useNavigate();

  // Fetch all userscripts
  const { data: scripts = [], refetch, isLoading } = trpc.userScripts.getAllScripts.useQuery();

  // Delete script mutation
  const deleteScript = trpc.userScripts.deleteScript.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Script deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete script', { description: error.message });
    },
  });

  // Filter scripts based on search and status
  const filteredScripts = scripts.filter((script) => {
    const q = searchQuery.toLowerCase();
    return (
      Array.isArray(script.matches) &&
      script.matches.some((m: string) => m.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="toolbar-surface-top mb-1">
        <div className="toolbar-inner px-2">
          <div className="flex items-center justify-between w-full py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground select-none">
                <FileCode className="h-4 w-4" />
                <div className="text-xs font-medium truncate">UserScripts</div>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {scripts?.length ?? 0}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => navigate({ to: '/userscripts/new' })}
                    size="icon"
                    className="btn-toolbar-primary h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Script</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 rounded-full"
          />
          {searchQuery && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Scripts List */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-1 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredScripts.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-full pr-1">
            {false ? (
              <div className="p-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Failed to load userscripts</AlertTitle>
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {({} as any)?.message ?? 'An unexpected error occurred.'}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : isLoading ? (
              <div className="space-y-1 p-2">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-3.5 w-40" />
                          <Skeleton className="h-4 w-10 rounded-full" />
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-10 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredScripts.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="rounded-md bg-accent/60 p-3">
                  <FileCode className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">
                    {searchQuery ? 'No results' : 'No userscripts yet'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try a different search or clear filters.'
                      : 'Add your first userscript to get started.'}
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate({ to: '/userscripts/new' })}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Script
                </Button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredScripts.map((script: any) => (
                  <Card
                    key={script.id}
                    className="group p-2 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: '/userscripts/$scriptId',
                        params: { scriptId: String(script.id) },
                      })
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium text-sm truncate max-w-[220px]">
                            {script.id}
                          </h3>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.isArray(script.matches) && script.matches.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {script.matches.length} match{script.matches.length > 1 ? 'es' : ''}
                            </Badge>
                          )}
                          {script.runAt && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {script.runAt}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Unregister userscript "${script.id}"?`)) {
                                  deleteScript.mutate({ id: String(script.id) });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Unregister</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
