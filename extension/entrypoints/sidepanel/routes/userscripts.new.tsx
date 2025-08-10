import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/entrypoints/sidepanel/components/ui/accordion';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { Card, CardContent, CardHeader } from '@/entrypoints/sidepanel/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/entrypoints/sidepanel/components/ui/form';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, FileCode, Plus, Trash2 } from 'lucide-react';
import { Controller, type FieldArrayPath, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { trpc } from '../lib/trpc_client';

export const Route = createFileRoute('/userscripts/new')({
  component: AddUserScriptPage,
});

function AddUserScriptPage() {
  const navigate = useNavigate();

  // Schema aligned to chrome.userScripts.register
  const formSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    matches: z
      .array(z.string().min(1, 'Match is required'))
      .min(1, 'At least one match is required'),
    excludeMatches: z.array(z.string().min(1)).optional(),
    runAt: z.enum(['document_start', 'document_end', 'document_idle']).default('document_idle'),
    allFrames: z.boolean().default(false),
    world: z.enum(['MAIN', 'USER_SCRIPT']).default('USER_SCRIPT'),
    worldId: z.string().optional(),
    code: z.string().min(1, 'Source is required'),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      id: '',
      matches: [''],
      excludeMatches: [],
      runAt: 'document_idle',
      allFrames: false,
      world: 'USER_SCRIPT',
      worldId: '',
      code: '',
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

  const onSubmit = (values: FormValues) => {
    const payload = {
      id: values.id.trim(),
      matches: values.matches.map((m) => m.trim()).filter((m) => m.length > 0),
      js: [{ code: values.code }],
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

  return (
    <div className="container py-2 flex flex-col h-full">
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
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileCode className="h-4 w-4" />
              <span className="text-sm">New Script</span>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-auto">
          <div className="space-y-3">
            {/* Basic Information */}
            <Card>
              <CardHeader className="py-1 px-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCode className="h-3.5 w-3.5" />
                  <span className="text-xs">Basics</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-2 pb-2">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Script ID</FormLabel>
                      <FormControl>
                        <Input placeholder="my-userscript" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Match Patterns */}
            <Card>
              <CardHeader className="py-1 px-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCode className="h-3.5 w-3.5" />
                  <span className="text-xs">Patterns</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-2 pb-2">
                <div>
                  <Label>Matches</Label>
                  <div className="space-y-2 mt-1.5">
                    {matchFields.map((mf, index) => (
                      <div key={mf.id} className="flex gap-2">
                        <Controller
                          control={form.control}
                          name={`matches.${index}`}
                          render={({ field }) => (
                            <Input placeholder="https://example.com/*" {...field} />
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
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => appendMatch('')}
                      >
                        <Plus className="h-4 w-4" />
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
                      <div>
                        <Label>Exclude Matches</Label>
                        <div className="space-y-2 mt-1.5">
                          {excludeFields.map((ef, index) => (
                            <div key={ef.id} className="flex gap-2">
                              <Controller
                                control={form.control}
                                name={`excludeMatches.${index}`}
                                render={({ field }) => (
                                  <Input placeholder="https://example.com/admin/*" {...field} />
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
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => appendExclude('')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
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
                            <FormItem>
                              <FormLabel>World ID</FormLabel>
                              <FormControl>
                                <Input placeholder="optional" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Script Source */}
            <Card>
              <CardHeader className="py-1 px-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCode className="h-3.5 w-3.5" />
                  <span className="text-xs">Source</span>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={12}
                          className="font-mono text-xs"
                          placeholder="// Your userscript code here..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-2 pb-2">
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
        </form>
      </Form>
    </div>
  );
}
