import { ZodProvider } from '@autoform/zod';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import {
  Bookmark,
  CheckCircle,
  Clock,
  Cookie,
  Database,
  Download,
  FileText,
  Globe,
  History,
  Puzzle,
  RefreshCw as RefreshCwIcon,
  Server,
  Settings,
  Square,
  Wifi,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { mcpToolsToZodSchemas } from '../../lib/mcpToZod';
import { cn } from '../../lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { CompactJsonViewer } from './CompactJsonViewer';
import { ToolCard } from './ToolCard';
import type { JsonValue } from './types';
import {
  formatMcpError,
  groupExtensionToolsByApi,
  groupToolsByDomain,
  isExtensionTool,
  parseToolInfo,
} from './utils';

// Chrome API icon mapping
const CHROME_API_ICONS: Record<string, React.ElementType> = {
  tabs: Square,
  bookmarks: Bookmark,
  storage: Database,
  history: History,
  alarms: Clock,
  notifications: RefreshCwIcon,
  cookies: Cookie,
  downloads: Download,
  windows: Square,
  commands: Settings,
  scripting: FileText,
  runtime: Settings,
  other: Puzzle,
};

export default function McpServer(): React.ReactElement {
  const {
    client,
    capabilities,
    isLoading,
    error,
    resources,
    tools: mcpTools,
    isConnected,
  } = useMcpClient();

  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [callingTools, setCallingTools] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<string>('');
  const [expandedChromeApi, setExpandedChromeApi] = useState<string>('');
  const [expandedDomain, setExpandedDomain] = useState<string>('');
  const [expandedTabGroup, setExpandedTabGroup] = useState<string>('');

  // Separate extension tools from web tools
  const { extensionTools, webTools } = useMemo(() => {
    const extension: McpTool[] = [];
    const web: McpTool[] = [];

    mcpTools.forEach((tool: McpTool) => {
      const { domain } = parseToolInfo(tool.name, tool.description);
      if (isExtensionTool(tool.name)) {
        extension.push(tool);
      } else {
        web.push(tool);
      }
    });

    return { extensionTools: extension, webTools: web };
  }, [mcpTools]);

  // Group tools by domain
  const toolsByDomain = useMemo(() => groupToolsByDomain(webTools), [webTools]);

  // Group extension tools by Chrome API
  const extensionToolsByApi = useMemo(
    () => groupExtensionToolsByApi(extensionTools),
    [extensionTools]
  );

  const toolSchemas = useMemo(() => {
    return mcpToolsToZodSchemas(mcpTools);
  }, [mcpTools]);

  // Track active tab changes and manage accordion states
  const [lastActiveTabId, setLastActiveTabId] = useState<number | null>(null);

  useEffect(() => {
    // Find the current active tab by looking for tools with "Active Tab" in description
    let currentActiveTabId: number | null = null;
    let activeDomain: string | null = null;

    for (const [domain, domainGroups] of toolsByDomain.entries()) {
      if (domainGroups.active.length > 0) {
        // Parse the first active tool to get tab ID
        const firstActiveTool = domainGroups.active[0];
        const toolInfo = parseToolInfo(firstActiveTool.name, firstActiveTool.description);
        if (toolInfo.tabId) {
          currentActiveTabId = toolInfo.tabId;
          activeDomain = domain;
          break;
        }
      }
    }

    // If active tab changed, update accordion states
    if (currentActiveTabId !== lastActiveTabId && currentActiveTabId !== null && activeDomain) {
      // Collapse any currently expanded tab groups
      if (expandedTabGroup) {
        setExpandedTabGroup('');
      }

      // Expand the new active domain and its active tab group
      setExpandedDomain(activeDomain);
      setExpandedTabGroup(`${activeDomain}-active`);

      // Update the tracked active tab ID
      setLastActiveTabId(currentActiveTabId);
    }
  }, [toolsByDomain, lastActiveTabId, expandedTabGroup]);

  if (isLoading) {
    return (
      <div className="h-full p-3">
        <Card className="overflow-hidden">
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
              <span className="font-medium text-xs text-muted-foreground">
                Connecting to MCP Hub...
              </span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <div className="px-3 pb-2.5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="h-2 w-2 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                <span>Discovering tools from active tabs...</span>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-3">
        <Alert variant="destructive" className="border-destructive/50">
          <XCircle className="h-3.5 w-3.5" />
          <AlertTitle className="text-xs font-medium">Connection Failed</AlertTitle>
          <AlertDescription className="text-xs mt-1 space-y-2">
            <p>{error.message || 'Unable to connect to the MCP hub'}</p>
            <div className="flex flex-col gap-1.5 mt-2">
              <Button
                // onClick={() => connect()}
                size="sm"
                variant="outline"
                className="h-6 text-[11px] w-full"
              >
                <RefreshCwIcon className="h-3 w-3 mr-1" />
                Retry Connection
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Make sure you have tabs open with MCP-enabled sites
              </p>
            </div>
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

  const callTool = async (toolName: string, data: unknown) => {
    if (!client) return toast.error('MCP client not found');
    setCallingTools((prev) => new Set([...prev, toolName]));
    const loadingToastId = toast.loading(`Executing ${toolName.split('_')[1]}...`);
    console.log(`calling tool ${toolName} with ${JSON.stringify(data, null, 2)}`);
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: data as Record<string, unknown>,
      });
      if (result.isError) {
        throw new Error(JSON.stringify(result.content, null, 2));
      }

      toast.dismiss(loadingToastId);

      let displayData = result;

      if (
        result &&
        typeof result === 'object' &&
        'content' in result &&
        Array.isArray(result.content) &&
        result.content[0]?.text
      ) {
        const text = result.content[0].text;
        try {
          displayData = JSON.parse(text);
        } catch {
          const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            try {
              displayData = JSON.parse(jsonMatch[0]);
            } catch {
              displayData = text;
            }
          } else {
            displayData = text;
          }
        }
      } else if (typeof result === 'string') {
        try {
          displayData = JSON.parse(result);
        } catch {
          const jsonMatch = (result as string)?.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            try {
              displayData = JSON.parse(jsonMatch[0]);
            } catch {
              displayData = result;
            }
          }
        }
      }

      const isPlainText = typeof displayData === 'string';

      toast.success(`${toolName} executed`, {
        description: isPlainText ? (
          <div className="mt-1 max-h-32 overflow-y-auto">
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
              {String(displayData)}
            </p>
          </div>
        ) : (
          <div className="mt-1 max-h-32 overflow-y-auto overflow-x-hidden">
            <CompactJsonViewer data={displayData as JsonValue} />
          </div>
        ),
        icon: <CheckCircle className="h-3 w-3" />,
        duration: 5000,
      });
    } catch (error) {
      // throw error;
      console.error(error);
      toast.dismiss(loadingToastId);

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
      <div className="p-2">
        <Accordion
          type="single"
          collapsible
          value={expandedSection}
          onValueChange={setExpandedSection}
        >
          <AccordionItem value="server" className="border-none">
            <Card className="overflow-hidden mb-1.5">
              <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                <div className="px-2.5 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-muted-foreground'
                      )}
                    />
                    <span className="font-medium text-xs">MCP Hub</span>
                    {expandedSection !== 'server' && (
                      <span
                        className={cn(
                          'text-[10px]',
                          isConnected ? 'text-green-600' : 'text-muted-foreground'
                        )}
                      >
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="px-2.5 pb-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Server Status</span>
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        isConnected ? 'text-green-600' : 'text-muted-foreground'
                      )}
                    >
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {/* {!isConnected && (
                    <Button
                      onClick={connect}
                      size="sm"
                      variant="outline"
                      className="w-full h-6 text-[11px]"
                    >
                      <Wifi className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  )} */}
                  {capabilities && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground">Capabilities</p>
                      <div className="flex flex-wrap gap-0.5">
                        {Object.entries(capabilities).map(([key, enabled]) => (
                          <Badge
                            key={key}
                            variant={enabled ? 'default' : 'secondary'}
                            className={cn(
                              'text-[9px] px-1 py-0 h-3',
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
              </AccordionContent>
            </Card>
          </AccordionItem>

          {capabilities?.tools && extensionTools.length > 0 && (
            <AccordionItem value="extensionTools" className="border-none">
              <Card className="overflow-hidden mb-1.5">
                <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                  <div className="px-2.5 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Puzzle className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-xs">Extension</span>
                      {expandedSection !== 'extensionTools' && (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                            {extensionTools.length}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            • {extensionToolsByApi.size} APIs
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="px-2.5 pb-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                        {extensionTools.length} tools
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3">
                        {extensionToolsByApi.size} {extensionToolsByApi.size === 1 ? 'API' : 'APIs'}
                      </Badge>
                    </div>
                    <Accordion
                      type="single"
                      collapsible
                      value={expandedChromeApi}
                      onValueChange={setExpandedChromeApi}
                    >
                      {Array.from(extensionToolsByApi.entries()).map(([api, apiTools]) => {
                        const Icon = CHROME_API_ICONS[api] || Puzzle;
                        return (
                          <AccordionItem key={api} value={api} className="border-none">
                            <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                              <div className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-1.5">
                                  <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                                  <span className="text-[11px] font-medium capitalize">{api}</span>
                                  <Badge variant="secondary" className="text-[9px] px-0.5 py-0 h-3">
                                    {apiTools.length}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                              <div className="pl-3 space-y-1 mt-0.5">
                                {apiTools.map((tool) => (
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
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {capabilities?.tools && (
            <AccordionItem value="tools" className="border-none">
              <Card className="overflow-hidden mb-1.5">
                <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                  <div className="px-2.5 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-xs">Web</span>
                      {expandedSection !== 'tools' && (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                            {webTools.length}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            • {toolsByDomain.size} sites
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="px-2.5 pb-2">
                    {webTools.length === 0 ? (
                      <div className="py-4 text-center">
                        <Globe className="h-6 w-6 mx-auto text-muted-foreground/30 mb-1.5" />
                        <p className="text-[11px] text-muted-foreground">No web tools discovered</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Open MCP-enabled sites
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                            {webTools.length} tools
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3">
                            {toolsByDomain.size} {toolsByDomain.size === 1 ? 'site' : 'sites'}
                          </Badge>
                        </div>
                        <Accordion
                          type="single"
                          collapsible
                          value={expandedDomain}
                          onValueChange={setExpandedDomain}
                        >
                          {Array.from(toolsByDomain.entries()).map(([domain, domainGroups]) => {
                            const totalTools =
                              domainGroups.active.length +
                              domainGroups.cached.length +
                              domainGroups.inactive.length;
                            return (
                              <AccordionItem key={domain} value={domain} className="border-none">
                                <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                                  <div className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-1.5">
                                      <Globe className="h-2.5 w-2.5 text-muted-foreground" />
                                      <span className="text-[11px] font-medium truncate max-w-[120px]">
                                        {domain}
                                      </span>
                                      <div className="flex items-center gap-0.5">
                                        {domainGroups.active.length > 0 && (
                                          <Badge
                                            variant="default"
                                            className="text-[9px] px-0.5 py-0 h-3 bg-green-500"
                                          >
                                            {domainGroups.active.length}
                                          </Badge>
                                        )}
                                        {domainGroups.cached.length > 0 && (
                                          <Badge
                                            variant="secondary"
                                            className="text-[9px] px-0.5 py-0 h-3"
                                          >
                                            {domainGroups.cached.length}
                                          </Badge>
                                        )}
                                        {domainGroups.inactive.length > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-0.5 py-0 h-3"
                                          >
                                            {domainGroups.inactive.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                  <div className="pl-3 space-y-2 mt-0.5">
                                    <Accordion
                                      type="single"
                                      collapsible
                                      value={expandedTabGroup}
                                      onValueChange={setExpandedTabGroup}
                                    >
                                      {domainGroups.active.length > 0 && (
                                        <AccordionItem
                                          key={`${domain}-active`}
                                          value={`${domain}-active`}
                                          className="border-none"
                                        >
                                          <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded hover:bg-muted/30 transition-colors">
                                              <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                  Active Tab{' '}
                                                  {domainGroups.active[0] &&
                                                    (() => {
                                                      const info = parseToolInfo(
                                                        domainGroups.active[0].name,
                                                        domainGroups.active[0].description
                                                      );
                                                      return info.tabId ? `(${info.tabId})` : '';
                                                    })()}
                                                </span>
                                                <Badge
                                                  variant="default"
                                                  className="text-[9px] px-0.5 py-0 h-3 bg-green-500"
                                                >
                                                  {domainGroups.active.length}
                                                </Badge>
                                              </div>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="p-0">
                                            <div className="pl-2 space-y-1 mt-0.5">
                                              {domainGroups.active.map((tool) => (
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
                                          </AccordionContent>
                                        </AccordionItem>
                                      )}
                                      {domainGroups.inactive.length > 0 && (
                                        <AccordionItem
                                          key={`${domain}-inactive`}
                                          value={`${domain}-inactive`}
                                          className="border-none"
                                        >
                                          <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded hover:bg-muted/30 transition-colors">
                                              <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                  Inactive Tab{' '}
                                                  {domainGroups.inactive[0] &&
                                                    (() => {
                                                      const info = parseToolInfo(
                                                        domainGroups.inactive[0].name,
                                                        domainGroups.inactive[0].description
                                                      );
                                                      return info.tabId ? `(${info.tabId})` : '';
                                                    })()}
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className="text-[9px] px-0.5 py-0 h-3"
                                                >
                                                  {domainGroups.inactive.length}
                                                </Badge>
                                              </div>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="p-0">
                                            <div className="pl-2 space-y-1 mt-0.5">
                                              {domainGroups.inactive.map((tool) => (
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
                                          </AccordionContent>
                                        </AccordionItem>
                                      )}
                                      {domainGroups.cached.length > 0 && (
                                        <AccordionItem
                                          key={`${domain}-cached`}
                                          value={`${domain}-cached`}
                                          className="border-none"
                                        >
                                          <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded hover:bg-muted/30 transition-colors">
                                              <div className="flex items-center gap-1">
                                                <Clock className="h-2 w-2 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                  Cached
                                                </span>
                                                <Badge
                                                  variant="secondary"
                                                  className="text-[9px] px-0.5 py-0 h-3"
                                                >
                                                  {domainGroups.cached.length}
                                                </Badge>
                                              </div>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="p-0">
                                            <div className="pl-2 space-y-1 mt-0.5">
                                              {domainGroups.cached.map((tool) => (
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
                                          </AccordionContent>
                                        </AccordionItem>
                                      )}
                                    </Accordion>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {capabilities?.resources && resources.length > 0 && (
            <AccordionItem value="resources" className="border-none">
              <Card className="overflow-hidden mb-1.5">
                <AccordionTrigger className="w-full px-0 py-0 hover:no-underline">
                  <div className="px-2.5 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-xs">Resources</span>
                      {expandedSection !== 'resources' && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                          {resources.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="px-2.5 pb-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                        {resources.length} resources
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {resources.map((resource: any) => (
                        <div
                          key={resource.uri}
                          className="p-1.5 rounded bg-muted/50 border border-muted-foreground/10"
                        >
                          <div className="font-medium text-[10px] text-foreground/90 truncate">
                            {resource.name || resource.uri}
                          </div>
                          {resource.description && (
                            <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
}
