import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { Badge } from '../ui/badge';
import type { InputSchema, McpErrorInfo, ToolInfo } from './types';

// Tool name prefixes
// Extension tools: extension_tool_{toolName}
// Website tools: website_tool_{cleanedDomain}_{toolName}
const EXTENSION_PREFIX = 'extension_tool_';
const WEBSITE_PREFIX = 'website_tool_';

/**
 * Sanitize a tool name to only include allowed characters (A-Z, a-z, 0-9, _)
 */
export function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Check if a tool is an extension tool
 */
export function isExtensionTool(toolName: string): boolean {
  return toolName.startsWith(EXTENSION_PREFIX);
}

/**
 * Check if a tool is a website tool
 */
export function isWebsiteTool(toolName: string): boolean {
  return toolName.startsWith(WEBSITE_PREFIX);
}

/**
 * Get the clean tool name without prefix
 */
export function getCleanToolName(toolName: string): string {
  if (isExtensionTool(toolName)) {
    return toolName.slice(EXTENSION_PREFIX.length);
  }
  if (isWebsiteTool(toolName)) {
    // For website tools with format: website_tool_{cleanedDomain}_{toolName}
    const withoutPrefix = toolName.slice(WEBSITE_PREFIX.length);
    const firstUnderscore = withoutPrefix.indexOf('_');

    if (firstUnderscore !== -1) {
      // Return everything after the domain part
      return withoutPrefix.slice(firstUnderscore + 1);
    }
    return withoutPrefix;
  }
  return toolName;
}

/**
 * Parse tool info from tool name and description
 */
export function parseToolInfo(toolName: string, description?: string): ToolInfo {
  // For extension tools
  if (isExtensionTool(toolName)) {
    const cleanName = getCleanToolName(toolName);
    return {
      domain: 'extension',
      cleanName,
      tabId: null,
      isActive: false,
      tabIndex: null,
    };
  }

  // For website tools with format: website_tool_{cleanedDomain}_{toolName}
  if (isWebsiteTool(toolName)) {
    // Remove the website_tool_ prefix
    const withoutPrefix = toolName.slice(WEBSITE_PREFIX.length);

    // Find the first underscore to separate domain from tool name
    const firstUnderscore = withoutPrefix.indexOf('_');

    let domain = 'unknown';
    let cleanName = withoutPrefix;

    if (firstUnderscore !== -1) {
      const cleanedDomain = withoutPrefix.slice(0, firstUnderscore);
      cleanName = withoutPrefix.slice(firstUnderscore + 1);

      // Try to reconstruct the domain from the cleaned version
      // Convert underscores back to dots/colons where appropriate
      domain = cleanedDomain
        .replace(/^localhost_(\d+)$/, 'localhost:$1') // localhost_3000 -> localhost:3000
        .replace(/_/g, '.'); // github_com -> github.com
    }

    let isActive = false;
    let tabIndex = null;

    if (description) {
      // Extract active status from description
      const domainMatch = description.match(/^\[([^\]]+)\]/);
      if (domainMatch) {
        const fullDomain = domainMatch[1];

        // Check for active indicator
        if (fullDomain.includes('• Active')) {
          isActive = true;
        }

        // Check for tab index (e.g., "Tab 2 Active")
        const tabIndexMatch = fullDomain.match(/Tab (\d+) Active/);
        if (tabIndexMatch) {
          tabIndex = parseInt(tabIndexMatch[1]);
        }
      }
    }

    return {
      domain,
      cleanName,
      tabId: null,
      isActive,
      tabIndex,
    };
  }

  // Fallback (shouldn't happen with new prefixes)
  return {
    domain: 'unknown',
    cleanName: toolName,
    tabId: null,
    isActive: false,
    tabIndex: null,
  };
}

/**
 * Group tools by their type (extension vs website)
 */
export function groupToolsByType(tools: McpTool[]) {
  const extensionTools: McpTool[] = [];
  const websiteTools: McpTool[] = [];

  tools.forEach((tool) => {
    if (isExtensionTool(tool.name)) {
      extensionTools.push(tool);
    } else if (isWebsiteTool(tool.name)) {
      websiteTools.push(tool);
    }
  });

  return { extensionTools, websiteTools };
}

/**
 * Group website tools by domain
 */
export function groupWebsiteToolsByDomain(tools: McpTool[]): Map<string, McpTool[]> {
  const grouped = new Map<string, McpTool[]>();

  tools.forEach((tool) => {
    const { domain } = parseToolInfo(tool.name, tool.description);
    const domainTools = grouped.get(domain) || [];
    domainTools.push(tool);
    grouped.set(domain, domainTools);
  });

  // Sort domains alphabetically
  const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  return new Map(sortedEntries);
}

/**
 * Extract Chrome API category from extension tool name
 */
export function extractChromeApiCategory(toolName: string): string {
  const cleanName = getCleanToolName(toolName).toLowerCase();

  // Direct mappings for specific tools
  const specificMappings: Record<string, string> = {
    list_active_tabs: 'tabs',
    navigate_tab_history: 'tabs',
    reload_tab: 'tabs',
    capture_visible_tab: 'tabs',
    execute_script: 'scripting',
    inject_css: 'scripting',
  };

  if (specificMappings[cleanName]) {
    return specificMappings[cleanName];
  }

  // Pattern-based detection
  if (cleanName.includes('tab')) return 'tabs';
  if (cleanName.includes('bookmark')) return 'bookmarks';
  if (cleanName.includes('storage')) return 'storage';
  if (cleanName.includes('history')) return 'history';
  if (cleanName.includes('alarm')) return 'alarms';
  if (cleanName.includes('notification')) return 'notifications';
  if (cleanName.includes('cookie')) return 'cookies';
  if (cleanName.includes('download')) return 'downloads';
  if (cleanName.includes('window')) return 'windows';
  if (cleanName.includes('command')) return 'commands';
  if (cleanName.includes('runtime')) return 'runtime';
  if (cleanName.includes('script')) return 'scripting';

  return 'other';
}

/**
 * Group extension tools by Chrome API
 */
export function groupExtensionToolsByApi(tools: McpTool[]): Map<string, McpTool[]> {
  const grouped = new Map<string, McpTool[]>();

  tools.forEach((tool) => {
    const apiCategory = extractChromeApiCategory(tool.name);
    const apiTools = grouped.get(apiCategory) || [];
    apiTools.push(tool);
    grouped.set(apiCategory, apiTools);
  });

  // Sort by API name
  const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  return new Map(sortedEntries);
}

/**
 * Format MCP error for display
 */
export function formatMcpError(error: unknown): McpErrorInfo {
  const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';

  const mcpErrorMatch = errorMessage.match(/MCP error (-?\d+):\s*(.+)/);

  if (mcpErrorMatch) {
    const errorCode = mcpErrorMatch[1];
    const errorDetails = mcpErrorMatch[2];

    const jsonMatch = errorDetails.match(/\[(.*)\]/s);

    if (jsonMatch) {
      try {
        const validationErrors = JSON.parse(`[${jsonMatch[1]}]`);

        return {
          title: `MCP Error ${errorCode}`,
          description: (
            <div className="space-y-2">
              <p className="text-xs">Invalid arguments provided:</p>
              <div className="space-y-1">
                {validationErrors.map((err: unknown, index: number) => {
                  const validationError = err as {
                    path?: string[];
                    message?: string;
                    validation?: string;
                  };
                  return (
                    <div key={index} className="bg-destructive/10 rounded p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {validationError.path?.join('.') || 'field'}
                        </Badge>
                        <span className="text-xs font-medium">
                          {validationError.message || 'Unknown error'}
                        </span>
                      </div>
                      {validationError.validation && (
                        <p className="text-xs text-muted-foreground">
                          Expected: {validationError.validation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ),
        };
      } catch (e) {
        return {
          title: `MCP Error ${errorCode}`,
          description: <p className="text-xs">{errorDetails.replace(/\[.*\]/, '').trim()}</p>,
        };
      }
    }

    return {
      title: `MCP Error ${errorCode}`,
      description: <p className="text-xs">{errorDetails}</p>,
    };
  }

  return {
    title: 'Execution Failed',
    description: <p className="text-xs">{errorMessage}</p>,
  };
}

/**
 * Get default values for input schema
 */
export function getDefaultValues(inputSchema?: InputSchema) {
  const defaults: Record<string, unknown> = {};

  if (inputSchema?.properties) {
    Object.entries(inputSchema.properties).forEach(([key, prop]) => {
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

export function groupToolsByDomain(tools: McpTool[]) {
  const grouped = new Map<string, McpTool[]>();

  tools.forEach((tool) => {
    const { domain } = parseToolInfo(tool.name, tool.description);
    const domainTools = grouped.get(domain) || [];
    domainTools.push(tool);
    grouped.set(domain, domainTools);
  });

  // Sort domains to put 'local' first, then alphabetically
  const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === 'local') return -1;
    if (b === 'local') return 1;
    return a.localeCompare(b);
  });

  return new Map(sortedEntries);
}
