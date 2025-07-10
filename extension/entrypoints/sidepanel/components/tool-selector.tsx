import { useThreadListItem } from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import {
  Bookmark,
  BrainCircuitIcon,
  CheckIcon,
  Clock,
  Cookie,
  Database,
  Download,
  FileText,
  Globe,
  History,
  Puzzle,
  Search,
  Settings,
  Square,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/entrypoints/sidepanel/components/ui/accordion';
import { Badge } from '@/entrypoints/sidepanel/components/ui/badge';
import { Button } from '@/entrypoints/sidepanel/components/ui/button';
import { Checkbox } from '@/entrypoints/sidepanel/components/ui/checkbox';
import { Input } from '@/entrypoints/sidepanel/components/ui/input';
import { cn } from '@/entrypoints/sidepanel/lib/utils';
import { useStorageItem } from '../hooks/wxtStorageHooks';
import {
  TOOL_PREFERENCES_STORAGE_KEY,
  validateToolPreferences,
  type ThreadToolPreferences,
} from '../lib/tool-preferences';
import {
  getCleanToolName,
  groupExtensionToolsByApi,
  groupToolsByType,
  groupWebsiteToolsByDomain,
  parseToolInfo,
} from './McpServer/utils';

interface ToolSelectorProps {
  onClose: () => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({ onClose }) => {
  // Chrome API icon mapping
  const CHROME_API_ICONS: Record<string, React.ElementType> = {
    tabs: Square,
    bookmarks: Bookmark,
    storage: Database,
    history: History,
    alarms: Clock,
    cookies: Cookie,
    downloads: Download,
    windows: Square,
    commands: Settings,
    scripting: FileText,
    runtime: Settings,
    other: Puzzle,
  };

  const threadId = useThreadListItem((t) => t.id);
  const { tools, isLoading, error, isConnected } = useMcpClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Use WXT storage for tool preferences
  const {
    value: storedPreferences,
    setValue: setStoredPreferences,
    loading: storageLoading,
    error: storageError,
  } = useStorageItem<ThreadToolPreferences>(TOOL_PREFERENCES_STORAGE_KEY, {
    fallback: {},
  });

  // Separate tools by type
  const { extensionTools, websiteTools } = useMemo(() => groupToolsByType(tools), [tools]);

  // Group tools
  const websiteToolsByDomain = useMemo(
    () => groupWebsiteToolsByDomain(websiteTools),
    [websiteTools]
  );
  const extensionToolsByApi = useMemo(
    () => groupExtensionToolsByApi(extensionTools),
    [extensionTools]
  );

  // Load saved preferences
  useEffect(() => {
    if (threadId && storedPreferences && !storageLoading) {
      const validatedPreferences = validateToolPreferences(storedPreferences);
      const threadPreferences = validatedPreferences[threadId];

      if (threadPreferences && threadPreferences.length > 0) {
        setSelectedTools(new Set(threadPreferences));
      } else {
        // If no preferences, select all tools by default
        const allToolNames = tools.map((t) => t.name);
        setSelectedTools(new Set(allToolNames));
      }
    }
  }, [threadId, tools, storedPreferences, storageLoading]);

  // Filter tools based on search
  const filteredWebsiteTools = useMemo(() => {
    if (!searchQuery) return websiteToolsByDomain;

    const filtered = new Map<string, McpTool[]>();
    websiteToolsByDomain.forEach((domainTools, domain) => {
      const matches = domainTools.filter((tool) => {
        const cleanName = getCleanToolName(tool.name);
        return (
          cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      if (matches.length > 0) {
        filtered.set(domain, matches);
      }
    });
    return filtered;
  }, [websiteToolsByDomain, searchQuery]);

  const filteredExtensionTools = useMemo(() => {
    if (!searchQuery) return extensionToolsByApi;

    const filtered = new Map<string, McpTool[]>();
    extensionToolsByApi.forEach((apiTools, api) => {
      const matches = apiTools.filter((tool) => {
        const cleanName = getCleanToolName(tool.name);
        return (
          cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      if (matches.length > 0) {
        filtered.set(api, matches);
      }
    });
    return filtered;
  }, [extensionToolsByApi, searchQuery]);

  const handleToggleTool = (fullToolName: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(fullToolName)) {
      newSelected.delete(fullToolName);
    } else {
      newSelected.add(fullToolName);
    }
    setSelectedTools(newSelected);
  };

  const handleToggleGroupExtension = (api: string) => {
    const newSelected = new Set(selectedTools);
    const apiTools = extensionToolsByApi.get(api) || [];
    const allToolsInGroup = apiTools.map((t) => t.name);
    const allSelected = allToolsInGroup.every((tool) => newSelected.has(tool));

    if (allSelected) {
      // Deselect all tools in this group
      allToolsInGroup.forEach((tool) => newSelected.delete(tool));
    } else {
      // Select all tools in this group
      allToolsInGroup.forEach((tool) => newSelected.add(tool));
    }
    setSelectedTools(newSelected);
  };

  const handleToggleGroupWebsite = (domain: string) => {
    const newSelected = new Set(selectedTools);
    const domainTools = websiteToolsByDomain.get(domain) || [];
    const allToolsInGroup = domainTools.map((t) => t.name);
    const allSelected = allToolsInGroup.every((tool) => newSelected.has(tool));

    if (allSelected) {
      // Deselect all tools in this group
      allToolsInGroup.forEach((tool) => newSelected.delete(tool));
    } else {
      // Select all tools in this group
      allToolsInGroup.forEach((tool) => newSelected.add(tool));
    }
    setSelectedTools(newSelected);
  };

  const isGroupSelectedExtension = (api: string) => {
    const apiTools = extensionToolsByApi.get(api) || [];
    if (apiTools.length === 0) return false;
    return apiTools.every((tool) => selectedTools.has(tool.name));
  };

  const isGroupIndeterminateExtension = (api: string) => {
    const apiTools = extensionToolsByApi.get(api) || [];
    if (apiTools.length === 0) return false;
    const selected = apiTools.filter((tool) => selectedTools.has(tool.name));
    return selected.length > 0 && selected.length < apiTools.length;
  };

  const isGroupSelectedWebsite = (domain: string) => {
    const domainTools = websiteToolsByDomain.get(domain) || [];
    if (domainTools.length === 0) return false;
    return domainTools.every((tool) => selectedTools.has(tool.name));
  };

  const isGroupIndeterminateWebsite = (domain: string) => {
    const domainTools = websiteToolsByDomain.get(domain) || [];
    if (domainTools.length === 0) return false;
    const selected = domainTools.filter((tool) => selectedTools.has(tool.name));
    return selected.length > 0 && selected.length < domainTools.length;
  };

  const handleSelectAll = () => {
    const allToolNames = tools.map((t) => t.name);
    setSelectedTools(new Set(allToolNames));
  };

  const handleDeselectAll = () => {
    setSelectedTools(new Set());
  };

  const handleSave = async () => {
    if (threadId && storedPreferences) {
      try {
        const validatedPreferences = validateToolPreferences(storedPreferences);
        const updatedPreferences = {
          ...validatedPreferences,
          [threadId]: Array.from(selectedTools),
        };
        await setStoredPreferences(updatedPreferences);
        onClose();
      } catch (error) {
        console.error('Failed to save tool preferences:', error);
      }
    }
  };

  if (isLoading || storageLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    );
  }

  if (error || storageError) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">
            {error ? 'Failed to load tools' : 'Failed to load preferences'}
          </p>
          <p className="text-xs text-muted-foreground">
            {error?.message || (storageError ? String(storageError) : 'Unknown error')}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state if still connecting but we have the client
  if (!isConnected && !error) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Connecting to MCP server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BrainCircuitIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Tool Selection</h2>
              <p className="text-xs text-muted-foreground">Choose tools for this thread</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selection stats */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {selectedTools.size} of {tools.length} tools selected
            </span>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {extensionTools.length} extension • {websiteTools.length} website
            </span>
          </div>
        </div>
      </div>

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-8">
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-3"
          >
            {/* Extension Tools */}
            {filteredExtensionTools.size > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Puzzle className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Extension Tools</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {extensionTools.length}
                  </Badge>
                </div>

                {Array.from(filteredExtensionTools.entries()).map(([api, apiTools]) => {
                  const Icon = CHROME_API_ICONS[api] || Puzzle;
                  const isSelected = isGroupSelectedExtension(api);
                  const isIndeterminate = isGroupIndeterminateExtension(api);

                  return (
                    <AccordionItem key={api} value={`ext-${api}`} className="border rounded-lg">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          checked={isIndeterminate || isSelected}
                          onCheckedChange={() => handleToggleGroupExtension(api)}
                        />
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">{api}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {apiTools.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-1 mt-1">
                          {apiTools.map((tool) => {
                            const cleanName = getCleanToolName(tool.name);
                            return (
                              <label
                                key={tool.name}
                                className={cn(
                                  'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                                  'hover:bg-muted/50',
                                  selectedTools.has(cleanName) && 'bg-primary/5'
                                )}
                              >
                                <Checkbox
                                  checked={selectedTools.has(cleanName)}
                                  onCheckedChange={() => handleToggleTool(cleanName)}
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{cleanName}</span>
                                  {tool.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {tool.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </div>
            )}

            {/* Website Tools */}
            {filteredWebsiteTools.size > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Website Tools</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {websiteTools.length}
                  </Badge>
                </div>

                {Array.from(filteredWebsiteTools.entries()).map(([domain, domainTools]) => {
                  const isSelected = isGroupSelectedWebsite(domain);
                  const isIndeterminate = isGroupIndeterminateWebsite(domain);

                  return (
                    <AccordionItem
                      key={domain}
                      value={`web-${domain}`}
                      className="border rounded-lg"
                    >
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          checked={isIndeterminate || isSelected}
                          onCheckedChange={() => handleToggleGroupWebsite(domain)}
                        />
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{domain}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {domainTools.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-1 mt-1">
                          {domainTools.map((tool) => {
                            const cleanName = getCleanToolName(tool.name);
                            const { isActive, tabIndex } = parseToolInfo(
                              tool.name,
                              tool.description
                            );

                            return (
                              <label
                                key={tool.name}
                                className={cn(
                                  'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                                  'hover:bg-muted/50',
                                  selectedTools.has(cleanName) && 'bg-primary/5'
                                )}
                              >
                                <Checkbox
                                  checked={selectedTools.has(cleanName)}
                                  onCheckedChange={() => handleToggleTool(cleanName)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{cleanName}</span>
                                    {isActive && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0 h-4"
                                      >
                                        {tabIndex !== null ? `Tab ${tabIndex}` : 'Active'}
                                      </Badge>
                                    )}
                                  </div>
                                  {tool.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {tool.description.replace(/^\[[^\]]+\]\s*/, '')}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </div>
            )}
          </Accordion>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="text-xs h-7 px-2"
              disabled={selectedTools.size === 0}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-7 px-2"
              disabled={selectedTools.size === tools.length}
            >
              All
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={onClose} className="h-7">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="h-7">
              <CheckIcon className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
