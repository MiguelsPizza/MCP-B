import type {
  CallToolResult,
  ContentBlock,
  Tool as McpTool,
} from '@modelcontextprotocol/sdk/types.js';
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-1">
      <div className="border border-blue-200 bg-blue-50/50 shadow-sm rounded-md overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="p-1.5 cursor-pointer hover:bg-blue-100/50 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {showSpinner && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0" />
                )}
                <Zap className="h-3 w-3 text-blue-600 flex-shrink-0" />
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-700 border-blue-300 text-[10px] px-1 py-0 h-4 flex-shrink-0"
                >
                  Running
                </Badge>
                <span className="text-xs font-medium text-blue-700 truncate" title={tool.name}>
                  {tool.name}
                </span>
              </div>
              <ChevronRight
                className={`h-3 w-3 text-blue-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-3 bg-white">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="font-medium text-blue-700">Name:</span>
                  <span className="ml-2 break-all">{tool.name}</span>
                </div>
                {tool.description && (
                  <div className="text-xs">
                    <span className="font-medium text-blue-700">Description:</span>
                    <span className="ml-2 break-words text-slate-600">{tool.description}</span>
                  </div>
                )}
              </div>
            </div>
            <ToolArgumentsDisplay tool={tool} args={args} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// Function to parse and clean error messages
const parseErrorMessage = (errorMessage: string): { summary: string; details?: any } => {
  // Handle MCP validation errors
  const mcpErrorMatch = errorMessage.match(/MCP error -32602: (.+?)(?:\n|$)/);
  if (mcpErrorMatch) {
    const mcpMessage = mcpErrorMatch[1];

    // Try to extract JSON validation details
    const jsonMatch = errorMessage.match(/(\[[\s\S]*?\])/);
    if (jsonMatch) {
      try {
        const validationErrors = JSON.parse(jsonMatch[1]);
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          const firstError = validationErrors[0];
          let summary = mcpMessage;

          if (firstError.path && firstError.message) {
            summary = `Invalid ${firstError.path.join('.')}: ${firstError.message}`;
          }

          return {
            summary,
            details: validationErrors,
          };
        }
      } catch {
        // Fall through to simpler parsing
      }
    }

    return { summary: mcpMessage };
  }

  // Handle "Failed to execute tool:" prefix
  const failedMatch = errorMessage.match(/^Failed to execute tool: (.+)/);
  if (failedMatch) {
    return parseErrorMessage(failedMatch[1]); // Recursively parse the inner error
  }

  // Handle other common error patterns
  if (errorMessage.includes('Error:')) {
    const cleanMessage = errorMessage.replace(/^Error:\s*/, '');
    return { summary: cleanMessage };
  }

  // Return original message if no patterns match
  return { summary: errorMessage };
};

export const ToolErrorUI: React.FC<{ tool: McpTool; status: any }> = ({ tool, status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rawErrorMessage = (status.error as Error)?.message || 'An unknown error occurred.';
  const { summary: errorMessage, details: errorDetails } = parseErrorMessage(rawErrorMessage);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-1">
      <div className="border border-red-200 bg-red-50/50 shadow-sm rounded-md overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="p-1.5 cursor-pointer hover:bg-red-100/50 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 border-red-300 text-[10px] px-1 py-0 h-4 flex-shrink-0"
                >
                  Failed
                </Badge>
                <span className="text-xs font-medium text-red-700 truncate" title={tool.name}>
                  {tool.name}
                </span>
              </div>
              <ChevronRight
                className={`h-3 w-3 text-red-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-3 bg-white">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Error
              </h4>
              <div className="bg-red-50 p-2 rounded-lg border border-red-200 overflow-x-auto">
                <div className="text-xs text-red-700 whitespace-pre-wrap break-words">
                  {errorMessage}
                </div>
                {errorDetails && (
                  <div className="mt-2 pt-2 border-t border-red-100">
                    <h5 className="text-xs font-medium text-red-600 mb-1">Details:</h5>
                    <JsonViewer data={errorDetails} defaultExpanded={true} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="font-medium text-red-700">Name:</span>
                  <span className="ml-2 break-all">{tool.name}</span>
                </div>
                {tool.description && (
                  <div className="text-xs">
                    <span className="font-medium text-red-700">Description:</span>
                    <span className="ml-2 break-words text-slate-600">{tool.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
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

export const ToolSuccessUI: React.FC<{ tool: McpTool; result: CallToolResult }> = ({
  tool,
  result,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if this is an error result according to MCP spec
  const isError = result?.isError === true;

  // Extract the main message from the MCP server response
  const getContentText = (content: ContentBlock[]): string => {
    if (!content || content.length === 0) {
      return 'Tool executed successfully but returned no result.';
    }

    // Handle different content types according to MCP spec
    const textContent = content.find((block) => block.type === 'text');
    if (textContent && 'text' in textContent) {
      return textContent.text;
    }

    // If no text content, provide a summary of what was returned
    const types = content.map((block) => block.type).join(', ');
    return `Tool returned ${content.length} content block(s) of type(s): ${types}`;
  };

  const mainMessage = getContentText(result?.content || []);

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
    } catch {
      // If parsing fails, treat as regular text
    }

    return {
      description: text,
      jsonData: null,
      hasJson: false,
    };
  };

  const { description, jsonData, hasJson } = parseResponseContent(mainMessage);

  // Determine styling based on error state
  const colorClasses = isError
    ? {
        border: 'border-red-200',
        bg: 'bg-red-50/50',
        hover: 'hover:bg-red-100/50',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700 border-red-300',
        text: 'text-red-700',
        contentBg: 'bg-red-50',
        contentBorder: 'border-red-200',
      }
    : {
        border: 'border-green-200',
        bg: 'bg-green-50/50',
        hover: 'hover:bg-green-100/50',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-700 border-green-300',
        text: 'text-green-700',
        contentBg: 'bg-green-50',
        contentBorder: 'border-green-200',
      };

  const IconComponent = isError ? AlertTriangle : CheckCircle;
  const statusText = isError ? 'Error' : 'Success';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-1">
      <div
        className={`border ${colorClasses.border} ${colorClasses.bg} shadow-sm rounded-md overflow-hidden`}
      >
        <CollapsibleTrigger asChild>
          <div className={`p-1.5 cursor-pointer ${colorClasses.hover} transition-colors`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconComponent className={`h-3 w-3 ${colorClasses.icon} flex-shrink-0`} />
                <Badge
                  variant="outline"
                  className={`${colorClasses.badge} text-[10px] px-1 py-0 h-4 flex-shrink-0`}
                >
                  {statusText}
                </Badge>
                <span
                  className={`text-xs font-medium ${colorClasses.text} truncate`}
                  title={tool.name}
                >
                  {tool.name}
                </span>
              </div>
              <ChevronRight
                className={`h-3 w-3 ${colorClasses.icon} transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-3 bg-white">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {isError ? 'Error Message' : 'Result'}
              </h4>
              <div
                className={`text-xs ${colorClasses.text} break-words ${colorClasses.contentBg} p-2 rounded-lg border ${colorClasses.contentBorder}`}
              >
                {description}
              </div>
            </div>

            {hasJson && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Parsed Data
                </h4>
                <div
                  className={`${colorClasses.contentBg} p-2 rounded-lg border ${colorClasses.contentBorder} overflow-x-auto`}
                >
                  <JsonViewer data={jsonData} defaultExpanded={true} />
                </div>
              </div>
            )}

            {/* Show structured content if available */}
            {result.structuredContent && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Structured Content
                </h4>
                <div
                  className={`${colorClasses.contentBg} p-2 rounded-lg border ${colorClasses.contentBorder} overflow-x-auto`}
                >
                  <JsonViewer data={result.structuredContent} defaultExpanded={true} />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Raw Response
              </h4>
              <div
                className={`${colorClasses.contentBg} p-2 rounded-lg border ${colorClasses.contentBorder} overflow-x-auto`}
              >
                <JsonViewer data={result} defaultExpanded={false} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="space-y-2">
                <div className="text-xs">
                  <span className={`font-medium ${colorClasses.text}`}>Name:</span>
                  <span className="ml-2 break-all">{tool.name}</span>
                </div>
                {tool.description && (
                  <div className="text-xs">
                    <span className={`font-medium ${colorClasses.text}`}>Description:</span>
                    <span className="ml-2 break-words text-slate-600">{tool.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
