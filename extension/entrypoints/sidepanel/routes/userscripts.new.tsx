import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/entrypoints/sidepanel/components/ui/accordion';
import { Badge } from '@/entrypoints/sidepanel/components/ui/badge';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/entrypoints/sidepanel/components/ui/form';
import { Input } from '@/entrypoints/sidepanel/components/ui/input';
import { Label } from '@/entrypoints/sidepanel/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/entrypoints/sidepanel/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, FileCode, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, type FieldArrayPath, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { trpc } from '../lib/trpc_client';

export const Route = createFileRoute('/userscripts/new')({
  component: AddUserScriptPage,
});

function AddUserScriptPage() {
  const navigate = useNavigate();
  const [hasCodeSaved, setHasCodeSaved] = useState(false);
  const openedOnceRef = useRef(false);

  function generateScriptId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    return `userscript-${year}${month}${day}-${hour}${minute}${second}-${randomSuffix}`;
  }

  // Schema aligned to chrome.userScripts.register
  const formSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    matches: z
      .array(z.string().min(1, 'Match is required'))
      .min(1, 'At least one match is required'),
    excludeMatches: z.array(z.string().min(1)).optional(),
    runAt: z.enum(['document_start', 'document_end', 'document_idle']).default('document_start'),
    allFrames: z.boolean().default(false),
    world: z.enum(['MAIN', 'USER_SCRIPT']).default('MAIN'),
    worldId: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      id: '',
      matches: [''],
      excludeMatches: [],
      runAt: 'document_start',
      allFrames: false,
      world: 'MAIN',
      worldId: '',
    },
    mode: 'onSubmit',
  });

  const {
    fields: matchFields,
    append: appendMatch,
    remove: removeMatch,
  } = useFieldArray<FormValues, FieldArrayPath<FormValues>, string>({
    control: form.control,
    name: 'matches' as FieldArrayPath<FormValues>,
  });
  const {
    fields: excludeFields,
    append: appendExclude,
    remove: removeExclude,
  } = useFieldArray<FormValues, FieldArrayPath<FormValues>, string>({
    control: form.control,
    name: 'excludeMatches' as FieldArrayPath<FormValues>,
  });

  // Add script mutation
  const registerScript = trpc.userScripts.registerScript.useMutation({
    onSuccess: () => {
      toast.success('Script registered');
      navigate({ to: '/userscripts' });
    },
    onError: (error: any) => {
      toast.error('Failed to register script', { description: error.message });
    },
  });

  const onSubmit = async (values: FormValues) => {
    const scriptId = values.id.trim();
    const matches = values.matches.map((m) => m.trim()).filter((m) => m.length > 0);

    // Load code content saved from the Monaco editor page
    const storageKey = `webmcp:userscripts:${scriptId}`;
    let codeFromEditor: string | undefined;
    try {
      const stored = await new Promise<any>((resolve, reject) => {
        try {
          // Use callback API for compatibility
          chrome.storage.local.get(storageKey, (items) => {
            const lastErr = chrome.runtime?.lastError;
            if (lastErr) return reject(lastErr);
            resolve(items);
          });
        } catch (e) {
          reject(e);
        }
      });
      const payload = stored?.[storageKey];
      if (typeof payload === 'string') {
        codeFromEditor = payload;
      } else if (payload && typeof payload.content === 'string') {
        codeFromEditor = payload.content;
      }
    } catch (err) {
      // ignore; will show a toast below if no code
    }

    if (!codeFromEditor || codeFromEditor.trim().length === 0) {
      toast.error('No userscript code found', {
        description: 'Open the editor, write your script, and click Save before registering.',
      });
      return;
    }

    const payload = {
      id: scriptId,
      matches,
      js: [{ code: codeFromEditor }],
      excludeMatches:
        values.excludeMatches && values.excludeMatches.length > 0
          ? values.excludeMatches.map((e) => e.trim()).filter((e) => e.length > 0)
          : undefined,
      allFrames: values.allFrames,
      runAt: values.runAt,
      world: values.world,
      worldId: values.worldId?.trim() || undefined,
    } as const;

    registerScript.mutate(payload as any);
  };

  // Auto-generate ID and open Monaco editor on first load
  useEffect(() => {
    if (openedOnceRef.current) return;
    openedOnceRef.current = true;

    let id = form.getValues('id')?.trim();
    if (!id) {
      id = generateScriptId();
      form.setValue('id', id, { shouldDirty: false, shouldValidate: true });
    }

    const base = chrome.runtime.getURL('/userscript-editor.html');
    const url = `${base}?id=${encodeURIComponent(id)}`;
    try {
      chrome.tabs.create({ url });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for storage changes to detect when code is saved in the editor
  useEffect(() => {
    const scriptId = form.watch('id');
    if (!scriptId) return;

    const storageKey = `webmcp:userscripts:${scriptId}`;
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[storageKey]) {
        const newValue = changes[storageKey].newValue;
        if (newValue && (typeof newValue === 'string' || newValue.content)) {
          setHasCodeSaved(true);
          toast.success('Code saved in editor', {
            description: 'You can now register the script',
            duration: 2000
          });
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Check if code already exists
    chrome.storage.local.get(storageKey, (items) => {
      const payload = items?.[storageKey];
      if (payload && (typeof payload === 'string' || payload.content)) {
        setHasCodeSaved(true);
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('id')]);

  // Populate matches with the hostname of the active tab
  useEffect(() => {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeUrl = tabs?.[0]?.url;
        if (activeUrl) {
          const { hostname, protocol } = new URL(activeUrl);
          // Use * scheme to cover http/https, but if protocol is chrome-extension or file, fall back
          const isWeb = protocol === 'http:' || protocol === 'https:';
          const pattern = isWeb ? `*://${hostname}/*` : '<all_urls>';
          form.setValue('matches', [pattern], { shouldDirty: false, shouldValidate: true });
        }
      } catch (e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditor = () => {
    const id = form.getValues('id')?.trim();
    if (!id) {
      toast.error('Script ID required', { description: 'Enter an ID before opening the editor.' });
      return;
    }
    const base = chrome.runtime.getURL('/userscript-editor.html');
    const url = `${base}?id=${encodeURIComponent(id)}`;
    chrome.tabs.create({ url });
  };

  return (
    <div className="box-border flex h-full flex-col overflow-hidden">
      <div className="toolbar-surface-top">
        <div className="toolbar-inner px-1 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="btn-toolbar-icon-primary"
                onClick={() => navigate({ to: '/userscripts' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                  <FileCode className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">Create userscript</span>
                  <span className="text-[11px] text-muted-foreground">Register and scope your script</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasCodeSaved ? (
                <Badge variant="secondary" className="badge-compact">
                  <Check className="h-3 w-3 mr-1" /> Code saved
                </Badge>
              ) : (
                <Badge variant="outline" className="badge-compact">Editor not saved</Badge>
              )}
              <Button type="button" size="sm" className="btn-toolbar-primary h-8" onClick={openEditor}>
                Open Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="w-full space-y-2">
                <div className="rounded-lg border border-border/60 bg-card p-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <FileCode className="h-3.5 w-3.5" />
                    <span className="text-xs">Patterns</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Matches</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Use URL patterns like <code>*://example.com/*</code> or <code>&lt;all_urls&gt;</code>
                      </p>
                      <div className="space-y-2 mt-1.5">
                        {matchFields.map((mf, index) => (
                          <div key={mf.id} className="flex gap-2">
                            <Controller
                              control={form.control}
                              name={`matches.${index}`}
                              render={({ field }) => (
                                <Input className="h-8" placeholder="https://example.com/*" {...field} />
                              )}
                            />
                            {matchFields.length > 1 && (
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
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => appendMatch('')}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add pattern
                          </Button>
                          {form.formState.errors.matches && (
                            <p className="text-destructive text-sm">
                              {form.formState.errors.matches.message as string}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="advanced-patterns">
                        <AccordionTrigger className="py-2 text-xs">Advanced</AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-lg border bg-muted/30 p-2">
                            <div>
                              <Label>Exclude Matches</Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Optional patterns to exclude from running.
                              </p>
                              <div className="space-y-2 mt-1.5">
                                {excludeFields.map((ef, index) => (
                                  <div key={ef.id} className="flex gap-2">
                                    <Controller
                                      control={form.control}
                                      name={`excludeMatches.${index}`}
                                      render={({ field }) => (
                                        <Input className="h-8" placeholder="https://example.com/admin/*" {...field} />
                                      )}
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
                                  className="h-8 px-2"
                                  onClick={() => appendExclude('')}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Add exclusion
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <FormField
                                control={form.control}
                                name="runAt"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Run At</FormLabel>
                                    <FormControl>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Select when to run" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="document_start">document_start</SelectItem>
                                          <SelectItem value="document_end">document_end</SelectItem>
                                          <SelectItem value="document_idle">document_idle</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="world"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>World</FormLabel>
                                    <FormControl>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Select world" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="USER_SCRIPT">USER_SCRIPT</SelectItem>
                                          <SelectItem value="MAIN">MAIN</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="worldId"
                                render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>World ID</FormLabel>
                                    <FormControl>
                                      <Input className="h-8" placeholder="optional" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="outline" className="badge-compact">
                    ID
                    <span
                      className="ml-1 inline-block max-w-[160px] truncate font-mono text-[11px]"
                      title={form.watch('id') || ''}
                    >
                      {form.watch('id') || '—'}
                    </span>
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => navigate({ to: '/userscripts' })}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-8" disabled={registerScript.isPending}>
                      {registerScript.isPending ? 'Registering…' : 'Register'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
