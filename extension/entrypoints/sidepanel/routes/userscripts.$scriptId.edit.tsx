import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/entrypoints/sidepanel/components/ui/card';
import { Input } from '@/entrypoints/sidepanel/components/ui/input';
import { Label } from '@/entrypoints/sidepanel/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/entrypoints/sidepanel/components/ui/select';
import { Textarea } from '@/entrypoints/sidepanel/components/ui/textarea';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc_client';

export const Route = createFileRoute('/userscripts/$scriptId/edit')({
  component: EditUserScriptPage,
});

function EditUserScriptPage() {
  const { scriptId } = Route.useParams();
  const navigate = useNavigate();
  // Fetch script details from chrome.userScripts
  const { data: script, isLoading } = trpc.userScripts.getScript.useQuery({ id: scriptId });

  const [matches, setMatches] = React.useState<string[]>([]);
  const [excludes, setExcludes] = React.useState<string[]>([]);

  // Initialize form state when script data loads
  React.useEffect(() => {
    if (script) {
      setMatches(script.matches || ['']);
      setExcludes(script.excludeMatches || ['']);
    }
  }, [script]);

  // Update script mutation (maps to chrome.userScripts.update)
  const updateScript = trpc.userScripts.updateScript.useMutation({
    onSuccess: () => {
      toast.success('Script updated successfully');
      navigate({ to: '/userscripts/$scriptId', params: { scriptId } });
    },
    onError: (error: any) => {
      toast.error('Failed to update script', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updates = {
      matches: matches.filter((m) => m.trim()),
      js: [{ code: (formData.get('source') as string) || '' }],
      excludeMatches: excludes.filter((e) => e.trim()) || undefined,
      runAt:
        (formData.get('runAt') as 'document_start' | 'document_end' | 'document_idle') || undefined,
    } as const;

    updateScript.mutate({ id: scriptId, updates } as any);
  };

  const addMatch = () => setMatches([...matches, '']);
  const removeMatch = (index: number) => setMatches(matches.filter((_, i) => i !== index));
  const updateMatch = (index: number, value: string) => {
    const newMatches = [...matches];
    newMatches[index] = value;
    setMatches(newMatches);
  };

  const addExclude = () => setExcludes([...excludes, '']);
  const removeExclude = (index: number) => setExcludes(excludes.filter((_, i) => i !== index));
  const updateExclude = (index: number, value: string) => {
    const newExcludes = [...excludes];
    newExcludes[index] = value;
    setExcludes(newExcludes);
  };

  if (isLoading) return null;

  if (!script) {
    return <div className="p-4">Script not found</div>;
  }

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="toolbar-surface-top mb-2">
        <div className="toolbar-inner px-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="btn-toolbar-icon-primary"
              onClick={() => navigate({ to: '/userscripts/$scriptId', params: { scriptId } })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Edit UserScript</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
        <div className="space-y-3">
          {/* Basic Information */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Basic Information</CardTitle>
              <CardDescription className="text-xs">
                Update the basic details of your userscript
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Script ID</Label>
                  <Input value={script.id} readOnly className="h-8" />
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Chrome-managed script; limited metadata available.
              </div>

              <div className="text-xs text-muted-foreground">
                Editing registered script properties
              </div>
            </CardContent>
          </Card>

          {/* Match Patterns */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Match Patterns</CardTitle>
              <CardDescription className="text-xs">
                Specify URLs where the script should run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3">
              <div>
                <Label>Matches *</Label>
                <div className="space-y-2 mt-1.5">
                  {matches.map((match, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={match}
                        onChange={(e) => updateMatch(index, e.target.value)}
                        placeholder="https://example.com/*"
                        required={index === 0}
                        className="h-8"
                      />
                      {matches.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeMatch(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={addMatch}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Match Pattern
                  </Button>
                </div>
              </div>

              <div>
                <Label>Exclude Matches</Label>
                <div className="space-y-2 mt-1.5">
                  {excludes.map((exclude, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={exclude}
                        onChange={(e) => updateExclude(index, e.target.value)}
                        placeholder="https://example.com/admin/*"
                        className="h-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeExclude(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={addExclude}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exclude Pattern
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="runAt">Run At</Label>
                <Select name="runAt" defaultValue={script.runAt || 'document_idle'}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select when to run the script" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document_start">document_start</SelectItem>
                    <SelectItem value="document_end">document_end</SelectItem>
                    <SelectItem value="document_idle">document_idle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Script Source */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Script Source</CardTitle>
              <CardDescription className="text-xs">Update your JavaScript code</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="source"
                name="source"
                required
                defaultValue={script.js?.[0]?.code || ''}
                placeholder="// Your userscript code here..."
                rows={12}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-2 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/userscripts/$scriptId', params: { scriptId } })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateScript.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {updateScript.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
