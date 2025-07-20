import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Loader2,
  MoreVertical,
  Terminal,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

// Better TypeScript interfaces
interface ToolRunningUIProps {
  tool: McpTool;
  args: Record<string, unknown>;
  showSpinner?: boolean;
}

interface ToolArgumentsDisplayProps {
  tool: McpTool;
  args: Record<string, unknown>;
}

const ToolArgumentsDisplay = ({ tool, args }: ToolArgumentsDisplayProps) => {
  const properties = tool.inputSchema?.properties;

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Code className="h-3 w-3" />
        <span>Tool does not require any arguments.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <Code className="h-3 w-3" />
        <span>Arguments:</span>
      </div>
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 overflow-auto space-y-2">
        {Object.keys(properties).map((key) => (
          <div key={key} className="flex flex-col gap-1 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span className="font-semibold text-slate-700 break-all">{key}:</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 shadow-sm ml-3">
              {args[key] !== undefined ? (
                <code className="text-slate-700 break-all text-xs">
                  {JSON.stringify(args[key], null, 2)}
                </code>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-500" />
                  <span className="text-slate-500 italic text-xs">streaming...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ToolRunningUI: React.FC<ToolRunningUIProps> = ({ tool, args, showSpinner = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-3 cursor-pointer hover:bg-blue-100/50 transition-colors">
            <div className="space-y-2">
              {/* Status and Icon Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showSpinner && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                  <Zap className="h-4 w-4 text-blue-600" />
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    In Progress
                  </Badge>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-blue-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </div>

              {/* Tool Name - Full width, wrappable */}
              <h3 className="text-sm font-semibold text-blue-700 break-words">{tool.name}</h3>

              {/* Description if available */}
              {tool.description && (
                <p className="text-xs text-slate-600 leading-relaxed break-words">
                  {tool.description}
                </p>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-3 pt-0 border-t border-blue-200">
            <ToolArgumentsDisplay tool={tool} args={args} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export const ToolErrorUI: React.FC<{ tool: McpTool; status: any }> = ({ tool, status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const errorMessage = (status.error as Error)?.message || 'An unknown error occurred.';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
      <Card className="border-red-200 bg-red-50/50 shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-3 cursor-pointer hover:bg-red-100/50 transition-colors">
            <div className="space-y-2">
              {/* Status and Icon Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    Failed
                  </Badge>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-red-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </div>

              {/* Tool Name - Full width, wrappable */}
              <h3 className="text-sm font-semibold text-red-700 break-words">{tool.name}</h3>

              {/* Error Message Preview */}
              <p className="text-xs text-red-700 font-medium break-words">{errorMessage}</p>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-3 pt-0 border-t border-red-200 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Error Details
              </h4>
              <div className="bg-white/50 p-2 rounded-lg border border-red-200 overflow-x-auto">
                <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                  {(status.error as Error)?.stack || errorMessage}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="break-words">
                  <span className="font-medium">Tool Name:</span> {tool.name}
                </div>
                {tool.description && (
                  <div className="break-words">
                    <span className="font-medium">Description:</span> {tool.description}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// Recursive JSON Viewer Component
const JsonViewer = ({
  data,
  name,
  level = 0,
  defaultExpanded = false,
}: {
  data: any;
  name?: string;
  level?: number;
  defaultExpanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValuePreview = (value: any): string => {
    const type = getValueType(value);
    switch (type) {
      case 'string': {
        // Truncate long strings in preview
        const str = String(value);
        return str.length > 30 ? `"${str.slice(0, 30)}..."` : `"${str}"`;
      }
      case 'number':
      case 'boolean':
        return String(value);
      case 'null':
        return 'null';
      case 'undefined':
        return 'undefined';
      case 'array':
        return `Array(${value.length})`;
      case 'object': {
        const keys = Object.keys(value);
        return `{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '...' : ''}}`;
      }
      default:
        return String(value);
    }
  };

  const getValueColor = (value: any): string => {
    const type = getValueType(value);
    switch (type) {
      case 'string':
        return 'text-green-600';
      case 'number':
        return 'text-blue-600';
      case 'boolean':
        return 'text-purple-600';
      case 'null':
      case 'undefined':
        return 'text-gray-500';
      case 'array':
      case 'object':
        return 'text-gray-700';
      default:
        return 'text-gray-700';
    }
  };

  const isExpandable = (value: any): boolean => {
    return (
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' && value !== null && Object.keys(value).length > 0)
    );
  };

  const isPrimitive = (value: any): boolean => {
    return !isExpandable(value);
  };

  const renderValue = (value: any, key?: string) => {
    if (isPrimitive(value)) {
      return (
        <div className="flex flex-col gap-0.5 font-mono text-xs">
          {key && <span className="text-gray-600 font-medium">{key}:</span>}
          <span className={`${getValueColor(value)} ml-2 break-all`}>{getValuePreview(value)}</span>
        </div>
      );
    }

    return (
      <div className="font-mono text-xs">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-0.5 hover:bg-gray-100 rounded px-0.5 py-0.5 transition-colors w-full text-left group"
        >
          {isExpanded ? (
            <ChevronDown className="h-2.5 w-2.5 text-gray-500" />
          ) : (
            <ChevronRight className="h-2.5 w-2.5 text-gray-500" />
          )}
          {key && <span className="text-gray-600 font-medium">{key}:</span>}
          <span className={`${getValueColor(value)} group-hover:text-gray-800 truncate`}>
            {getValuePreview(value)}
          </span>
        </button>

        {isExpanded && (
          <div className="ml-3 border-l border-gray-200 pl-2 mt-0.5 space-y-0.5">
            {Array.isArray(value)
              ? value.map((item, index) => (
                  <JsonViewer
                    key={index}
                    data={item}
                    name={String(index)}
                    level={level + 1}
                    defaultExpanded={false}
                  />
                ))
              : Object.entries(value).map(([objKey, objValue]) => (
                  <JsonViewer
                    key={objKey}
                    data={objValue}
                    name={objKey}
                    level={level + 1}
                    defaultExpanded={false}
                  />
                ))}
          </div>
        )}
      </div>
    );
  };

  return renderValue(data, name);
};

type ToolResult = {
  content: {
    type: 'text';
    text: string;
  }[];
};

export const ToolSuccessUI: React.FC<{ tool: McpTool; result: ToolResult }> = ({
  tool,
  result,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract the main message from the MCP server response
  const mainMessage =
    result?.content?.[0]?.text || 'Tool executed successfully but returned no result.';

  // Function to extract and parse JSON from text
  const parseResponseContent = (text: string) => {
    try {
      // Look for JSON patterns in the text
      const jsonMatch = text.match(/(\[.*\]|\{.*\})/s);
      if (jsonMatch) {
        const jsonString = jsonMatch[1];
        const parsedJson = JSON.parse(jsonString);
        const description = text.replace(jsonString, '').trim().replace(/:\s*$/, '');
        return {
          description,
          jsonData: parsedJson,
          hasJson: true,
        };
      }
    } catch (e) {
      // If parsing fails, treat as regular text
    }

    return {
      description: text,
      jsonData: null,
      hasJson: false,
    };
  };

  const { description, jsonData, hasJson } = parseResponseContent(mainMessage);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
      <Card className="border-green-200 bg-green-50/50 shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-3 cursor-pointer hover:bg-green-100/50 transition-colors">
            <div className="space-y-2">
              {/* Status and Icon Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Completed
                  </Badge>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-green-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </div>

              {/* Tool Name - Full width, wrappable */}
              <h3 className="text-sm font-semibold text-green-700 break-words">{tool.name}</h3>

              {/* Result Preview */}
              <p className="text-xs text-green-700 font-medium break-words">{description}</p>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-3 pt-0 border-t border-green-200 space-y-3">
            {hasJson && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Parsed Result
                </h4>
                <div className="bg-white/50 p-2 rounded-lg border border-green-200 overflow-x-auto">
                  <JsonViewer data={jsonData} defaultExpanded={true} />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Raw Tool Response
              </h4>
              <div className="bg-white/50 p-2 rounded-lg border border-green-200 overflow-x-auto">
                <JsonViewer data={result} defaultExpanded={false} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="break-words">
                  <span className="font-medium">Tool Name:</span> {tool.name}
                </div>
                {tool.description && (
                  <div className="break-words">
                    <span className="font-medium">Description:</span> {tool.description}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
