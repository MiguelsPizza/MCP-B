import { useState } from 'react';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Loader2,
  Terminal,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Code className="h-4 w-4" />
        <span>Tool does not require any arguments.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Code className="h-4 w-4" />
        <span>Arguments:</span>
      </div>
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto space-y-3">
        {Object.keys(properties).map((key) => (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono text-sm"
          >
            <div className="flex items-center gap-2 min-w-0 sm:w-1/3">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="font-semibold text-slate-700 truncate">{key}:</span>
            </div>
            <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              {args[key] !== undefined ? (
                <code className="text-slate-700 break-all">
                  {JSON.stringify(args[key], null, 2)}
                </code>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                  <span className="text-slate-500 italic">streaming...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ToolRunningUI = ({ tool, args, showSpinner = true }: ToolRunningUIProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="my-4 border-blue-200 bg-blue-50/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-base font-semibold text-blue-700">
            {showSpinner && <Loader2 className="h-5 w-5 animate-spin" />}
            <Zap className="h-5 w-5" />
            <span>Running: {tool.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-blue-100 border border-blue-200">
              <span className="text-xs font-medium text-blue-700">In Progress</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  Show
                </>
              )}
            </button>
          </div>
        </CardTitle>

        {tool.description && (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{tool.description}</p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <ToolArgumentsDisplay tool={tool} args={args} />
        </CardContent>
      )}
    </Card>
  );
};

export const ToolErrorUI = ({ tool, status }: { tool: McpTool; status: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="my-4 border-red-200 bg-red-50/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-base font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Error: {tool.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-red-100 border border-red-200">
              <span className="text-xs font-medium text-red-700">Failed</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  Show
                </>
              )}
            </button>
          </div>
        </CardTitle>

        <div className="text-sm text-red-700 font-medium mt-2">
          {(status.error as Error)?.message || 'An unknown error occurred.'}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Error Details
              </h4>
              <div className="bg-white/50 p-3 rounded-lg border border-red-200">
                <pre className="text-sm text-red-700 whitespace-pre-wrap">
                  {(status.error as Error)?.stack ||
                    (status.error as Error)?.message ||
                    'No additional error details available.'}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">Tool Name:</span> {tool.name}
                </div>
                {tool.description && (
                  <div>
                    <span className="font-medium">Description:</span> {tool.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
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
      case 'string':
        return `"${value}"`;
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
        return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
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
        <div className="flex items-center gap-2 font-mono text-sm">
          {key && <span className="text-gray-600 font-medium">{key}:</span>}
          <span className={getValueColor(value)}>{getValuePreview(value)}</span>
        </div>
      );
    }

    return (
      <div className="font-mono text-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 hover:bg-gray-100 rounded px-1 py-0.5 transition-colors w-full text-left group"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-gray-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-500" />
          )}
          {key && <span className="text-gray-600 font-medium">{key}:</span>}
          <span className={`${getValueColor(value)} group-hover:text-gray-800`}>
            {getValuePreview(value)}
          </span>
        </button>

        {isExpanded && (
          <div className="ml-4 border-l border-gray-200 pl-4 mt-1 space-y-1">
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

export const ToolSuccessUI = ({ tool, result }: { tool: McpTool; result: ToolResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <Card className="my-4 border-green-200 bg-green-50/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-base font-semibold text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>Success: {tool.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-green-100 border border-green-200">
              <span className="text-xs font-medium text-green-700">Completed</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  Show
                </>
              )}
            </button>
          </div>
        </CardTitle>

        {hasJson && description ? (
          <div className="text-sm text-green-700 font-medium mt-2">{description}</div>
        ) : (
          <div className="text-sm text-green-700 font-medium mt-2">{description}</div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {hasJson && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Parsed Result
                </h4>
                <div className="bg-white/50 p-3 rounded-lg border border-green-200">
                  <JsonViewer data={jsonData} defaultExpanded={true} />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Raw Tool Response
              </h4>
              <div className="bg-white/50 p-3 rounded-lg border border-green-200">
                <JsonViewer data={result} defaultExpanded={false} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Tool Information
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">Tool Name:</span> {tool.name}
                </div>
                {tool.description && (
                  <div>
                    <span className="font-medium">Description:</span> {tool.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
