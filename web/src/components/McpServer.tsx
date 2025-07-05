import { zodResolver } from '@hookform/resolvers/zod';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  FileTextIcon,
  Package,
  Play,
  Server,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';

// Compact JSON viewer for toast notifications
const CompactJsonViewer = ({ data, className = '' }: { data: any; className?: string }) => {
  const getValueColor = (value: any): string => {
    if (value === null) return 'text-gray-400';
    if (typeof value === 'string') return 'text-green-600 dark:text-green-400';
    if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
    if (Array.isArray(value)) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null) return <span className={getValueColor(value)}>null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;

    if (typeof value === 'string') {
      // Truncate long strings
      const maxLength = 50;
      const displayValue = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
      return <span className={getValueColor(value)}>"{displayValue}"</span>;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span className={getValueColor(value)}>{String(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className={getValueColor(value)}>[]</span>;
      if (depth > 0) return <span className={getValueColor(value)}>[{value.length} items]</span>;

      // Show max 3 items in arrays
      const itemsToShow = value.slice(0, 3);
      const hasMore = value.length > 3;

      return (
        <span className={getValueColor(value)}>
          [
          {itemsToShow.map((item, i) => (
            <span key={i}>
              {i > 0 && ', '}
              {formatValue(item, depth + 1)}
            </span>
          ))}
          {hasMore && <span className="text-gray-400">, ...{value.length - 3} more</span>}]
        </span>
      );
    }

    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span className="text-gray-400">{'{}'}</span>;
      if (depth > 0) return <span className="text-gray-400">{`{${entries.length} props}`}</span>;

      // Show max 5 properties at root level
      const entriesToShow = entries.slice(0, 5);
      const hasMore = entries.length > 5;

      return (
        <div className="inline-block">
          <span className="text-gray-400">{'{ '}</span>
          {entriesToShow.map(([key, val], i) => (
            <span key={key}>
              {i > 0 && ', '}
              <span className="text-gray-600 dark:text-gray-400">{key}:</span>{' '}
              {formatValue(val, depth + 1)}
            </span>
          ))}
          {hasMore && <span className="text-gray-400">, ...{entries.length - 5} more</span>}
          <span className="text-gray-400">{' }'}</span>
        </div>
      );
    }

    return <span className="text-gray-600">{String(value)}</span>;
  };

  return (
    <div className={cn('font-mono text-[10px] leading-relaxed', className)}>
      {formatValue(data)}
    </div>
  );
};

// Add this helper function to parse and format MCP errors
function formatMcpError(error: any): {
  title: string;
  description: React.ReactNode;
} {
  const errorMessage = error.message || 'Tool execution failed';

  // Check if this is an MCP validation error with JSON data
  const mcpErrorMatch = errorMessage.match(/MCP error (-?\d+):\s*(.+)/);

  if (mcpErrorMatch) {
    const errorCode = mcpErrorMatch[1];
    const errorDetails = mcpErrorMatch[2];

    // Try to extract JSON validation errors
    const jsonMatch = errorDetails.match(/\[(.*)\]/s);

    if (jsonMatch) {
      try {
        // Parse the JSON array
        const validationErrors = JSON.parse(`[${jsonMatch[1]}]`);

        return {
          title: `MCP Error ${errorCode}`,
          description: (
            <div className="space-y-2">
              <p className="text-xs">Invalid arguments provided:</p>
              <div className="space-y-1">
                {validationErrors.map((err: any, index: number) => (
                  <div key={index} className="bg-destructive/10 rounded p-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {err.path?.join('.') || 'field'}
                      </Badge>
                      <span className="text-xs font-medium">{err.message}</span>
                    </div>
                    {err.validation && (
                      <p className="text-xs text-muted-foreground">Expected: {err.validation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ),
        };
      } catch (e) {
        // If JSON parsing fails, return a cleaner version
        return {
          title: `MCP Error ${errorCode}`,
          description: <p className="text-xs">{errorDetails.replace(/\[.*\]/, '').trim()}</p>,
        };
      }
    }

    // Non-JSON MCP error
    return {
      title: `MCP Error ${errorCode}`,
      description: <p className="text-xs">{errorDetails}</p>,
    };
  }

  // Regular error
  return {
    title: 'Execution Failed',
    description: <p className="text-xs">{errorMessage}</p>,
  };
}

export default function McpServer() {
  const {
    client,
    capabilities,
    isLoading,
    error,
    resources,
    tools: mcpTools,
    isConnected,
  } = useMcpClient();

  console.log('mcpTools', mcpTools);

  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [callingTools, setCallingTools] = useState<Set<string>>(new Set());
  const [sectionsOpen, setSectionsOpen] = useState({
    server: true,
    tools: true,
    resources: true,
  });

  // Create Zod schemas for each tool dynamically
  const toolSchemas = useMemo(() => {
    const schemas: Record<string, z.ZodObject<any>> = {};

    mcpTools.forEach((tool) => {
      if (tool.inputSchema?.properties) {
        const schemaShape: Record<string, z.ZodType<any>> = {};

        Object.entries(tool.inputSchema.properties).forEach(([key, prop]: [string, any]) => {
          let zodType: z.ZodType<any>;

          // Handle different types
          switch (prop.type) {
            case 'string':
              if (prop.enum) {
                // Handle enum as a select field
                zodType = z.enum(prop.enum as [string, ...string[]]);
              } else {
                zodType = z.string();
              }
              break;
            case 'number':
              zodType = z.number();
              break;
            case 'boolean':
              zodType = z.boolean();
              break;
            case 'array':
              zodType = z.array(z.any());
              break;
            case 'object':
              zodType = z.object({});
              break;
            default:
              zodType = z.any();
          }

          // Apply additional validators
          if (prop.minLength && zodType instanceof z.ZodString) {
            zodType = zodType.min(prop.minLength);
          }
          if (prop.maxLength && zodType instanceof z.ZodString) {
            zodType = zodType.max(prop.maxLength);
          }
          if (prop.minimum !== undefined && zodType instanceof z.ZodNumber) {
            zodType = zodType.min(prop.minimum);
          }
          if (prop.maximum !== undefined && zodType instanceof z.ZodNumber) {
            zodType = zodType.max(prop.maximum);
          }

          // Handle required fields
          const isRequired = (tool.inputSchema.required as string[])?.includes(key) || false;
          if (!isRequired && prop.type !== 'boolean') {
            zodType = zodType.optional();
          }

          schemaShape[key] = zodType;
        });

        schemas[tool.name] = z.object(schemaShape);
      }
    });

    return schemas;
  }, [mcpTools]);

  if (isLoading) {
    return (
      <div className="h-full p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-3">
        <Alert variant="destructive" className="border-destructive/50">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertTitle className="text-xs font-medium">Connection Error</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {error.message || 'Failed to connect to MCP server'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const toggleToolExpanded = (toolName: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolName)) {
      newExpanded.delete(toolName);
    } else {
      newExpanded.add(toolName);
    }
    setExpandedTools(newExpanded);
  };

  const callTool = async (toolName: string, data: any) => {
    if (!client) return toast.error('MCP client not found');
    setCallingTools((prev) => new Set([...prev, toolName]));

    // Show loading toast
    const loadingToastId = toast.loading(`Executing ${toolName}...`);

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: data,
      });

      // Dismiss loading toast and show success with result
      toast.dismiss(loadingToastId);

      // Parse the result if it's a string containing JSON
      let displayData = result;

      // Handle MCP tool result format
      if ((result as any)?.content?.[0]?.text) {
        const text = (result as any).content[0].text;
        try {
          // Try to parse the text content as JSON
          displayData = JSON.parse(text);
        } catch {
          // If it's not valid JSON, check if it contains JSON
          const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            try {
              displayData = JSON.parse(jsonMatch[0]);
            } catch {
              // Keep as string if parsing fails
              displayData = text;
            }
          } else {
            displayData = text;
          }
        }
      } else if (typeof result === 'string') {
        try {
          // Try to parse as JSON
          displayData = JSON.parse(result);
        } catch {
          // If it's not valid JSON, check if it contains JSON
          const jsonMatch = (result as string)?.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            try {
              displayData = JSON.parse(jsonMatch[0]);
            } catch {
              // Keep as string if parsing fails
              displayData = result;
            }
          }
        }
      }

      // Determine if we have structured data or plain text
      const isPlainText = typeof displayData === 'string';

      toast.success(`${toolName} executed`, {
        description: isPlainText ? (
          <div className="mt-1 max-h-32 overflow-y-auto">
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
              {displayData as unknown as string}
            </p>
          </div>
        ) : (
          <div className="mt-1 max-h-32 overflow-y-auto overflow-x-hidden">
            <CompactJsonViewer data={displayData} />
          </div>
        ),
        icon: <CheckCircle className="h-3 w-3" />,
        duration: 5000,
      });
    } catch (error: any) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToastId);

      // Format the error nicely
      const { title, description } = formatMcpError(error);

      toast.error(`${toolName} failed: ${title}`, {
        description,
        icon: <XCircle className="h-4 w-4" />,
        duration: 7000,
        action: {
          label: 'Retry',
          onClick: () => {
            const form = document.querySelector(
              `[data-tool-form="${toolName}"]`
            ) as HTMLFormElement;
            if (form) {
              form.requestSubmit();
            }
          },
        },
      });
    } finally {
      setCallingTools((prev) => {
        const newSet = new Set(prev);
        newSet.delete(toolName);
        return newSet;
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-3 space-y-2">
        {/* Server Info */}
        <Collapsible
          open={sectionsOpen.server}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, server: open }))}
        >
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="px-3 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Server className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="font-medium text-xs">Server Status</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        isConnected ? 'text-green-600' : 'text-muted-foreground'
                      )}
                    >
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                    !sectionsOpen.server && '-rotate-90'
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-2.5 space-y-2">
                {/* {!isConnected && (
                  <Button
                    onClick={connect}
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                  >
                    <Wifi className="h-3 w-3 mr-1.5" />
                    Connect to Server
                  </Button>
                )} */}
                {capabilities && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Capabilities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(capabilities).map(([key, enabled]) => (
                        <Badge
                          key={key}
                          variant={enabled ? 'default' : 'secondary'}
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-4',
                            enabled
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Tools */}
        {capabilities?.tools && mcpTools.length > 0 && (
          <Collapsible
            open={sectionsOpen.tools}
            onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, tools: open }))}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="px-3 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="font-medium text-xs">Tools</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {mcpTools.length}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                      !sectionsOpen.tools && '-rotate-90'
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-2.5">
                  <div className="space-y-1.5">
                    {mcpTools.map((tool) => (
                      <ToolCard
                        key={tool.name}
                        tool={tool}
                        isExpanded={expandedTools.has(tool.name)}
                        onToggle={() => toggleToolExpanded(tool.name)}
                        onCall={callTool}
                        isCalling={callingTools.has(tool.name)}
                        schema={toolSchemas[tool.name]}
                      />
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Resources */}
        {capabilities?.resources && resources.length > 0 && (
          <Collapsible
            open={sectionsOpen.resources}
            onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, resources: open }))}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="px-3 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="font-medium text-xs">Resources</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {resources.length}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                      !sectionsOpen.resources && '-rotate-90'
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-2.5">
                  <div className="space-y-1.5">
                    {resources.map((resource) => (
                      <div
                        key={resource.uri}
                        className="p-2 rounded-md bg-muted/50 border border-muted-foreground/10"
                      >
                        <div className="font-medium text-[11px] text-foreground/90 truncate">
                          {resource.name || resource.uri}
                        </div>
                        {resource.description && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                            {resource.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

interface ToolCardProps {
  tool: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCall: (toolName: string, data: any) => void;
  isCalling: boolean;
  schema?: z.ZodObject<any>;
}

function ToolCard({ tool, isExpanded, onToggle, onCall, isCalling, schema }: ToolCardProps) {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: getDefaultValues(tool.inputSchema),
  });

  const onSubmit = (data: any) => {
    onCall(tool.name, data);
  };

  const hasParameters =
    tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0;

  return (
    <div className="rounded-md border border-border/50 bg-card overflow-hidden">
      <div
        className="px-2.5 py-2 cursor-pointer hover:bg-muted/30 transition-colors flex items-center justify-between gap-2"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate">{tool.name}</span>
              {!hasParameters && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                  No params
                </Badge>
              )}
            </div>
            {tool.description && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {tool.description}
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
        <div className="px-2.5 pb-2.5 pt-0 border-t border-border/50">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2.5"
              data-tool-form={tool.name}
            >
              {/* Tool Parameters */}
              {hasParameters && (
                <div className="space-y-2">
                  {Object.entries(tool.inputSchema.properties).map(
                    ([paramName, paramSchema]: [string, any]) => (
                      <FormField
                        key={paramName}
                        control={form.control}
                        name={paramName}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[11px] font-medium text-foreground/80">
                              {paramName}
                              {tool.inputSchema.required?.includes(paramName) && (
                                <span className="text-destructive ml-0.5">*</span>
                              )}
                            </FormLabel>
                            {renderFormControl(field, paramSchema)}
                            {paramSchema.description && (
                              <FormDescription className="text-[10px] text-muted-foreground">
                                {paramSchema.description}
                              </FormDescription>
                            )}
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    )
                  )}
                </div>
              )}

              {/* Call Tool Button */}
              <Button
                type="submit"
                disabled={isCalling}
                size="sm"
                className="w-full h-6 text-[11px] font-medium"
                variant={isCalling ? 'secondary' : 'default'}
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
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

function renderFormControl(field: any, paramSchema: any) {
  // Handle enum fields as select
  if (paramSchema.enum && Array.isArray(paramSchema.enum)) {
    return (
      <FormControl>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectTrigger className="text-[11px] h-6">
            <SelectValue placeholder={`Select ${field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {paramSchema.enum.map((value: string) => (
              <SelectItem key={value} value={value} className="text-[11px]">
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
    );
  }

  // Handle different input types
  switch (paramSchema.type) {
    case 'boolean':
      return (
        <FormControl>
          <div className="flex items-center space-x-2">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-3 w-3" />
            <label className="text-[10px] text-muted-foreground">Enable</label>
          </div>
        </FormControl>
      );

    case 'string':
      if (paramSchema.maxLength && paramSchema.maxLength > 100) {
        return (
          <FormControl>
            <Textarea
              {...field}
              placeholder={`Enter ${field.name}...`}
              className="text-[11px] min-h-[50px] resize-none"
              rows={2}
            />
          </FormControl>
        );
      }
      return (
        <FormControl>
          <Input
            {...field}
            placeholder={`Enter ${field.name}...`}
            className="text-[11px] h-6 px-2"
          />
        </FormControl>
      );

    case 'number':
      return (
        <FormControl>
          <Input
            {...field}
            type="number"
            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="0"
            className="text-[11px] h-6 px-2"
          />
        </FormControl>
      );

    default:
      return (
        <FormControl>
          <Input
            {...field}
            placeholder={`Enter ${field.name}...`}
            className="text-[11px] h-6 px-2"
          />
        </FormControl>
      );
  }
}

function getDefaultValues(inputSchema: any) {
  const defaults: Record<string, any> = {};

  if (inputSchema?.properties) {
    Object.entries(inputSchema.properties).forEach(([key, prop]: [string, any]) => {
      switch (prop.type) {
        case 'boolean':
          defaults[key] = false;
          break;
        case 'number':
          defaults[key] = prop.default ?? '';
          break;
        case 'string':
          defaults[key] = prop.default ?? '';
          break;
        case 'array':
          defaults[key] = [];
          break;
        case 'object':
          defaults[key] = {};
          break;
        default:
          defaults[key] = '';
      }
    });
  }

  return defaults;
}
