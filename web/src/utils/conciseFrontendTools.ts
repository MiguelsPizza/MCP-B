import { frontendTools } from '@assistant-ui/react-ai-sdk';
import type { JSONSchema7 } from 'json-schema';

/**
 * Transforms MCP tool names to use a more concise naming convention.
 *
 * @param originalName - The original tool name to transform
 * @returns The transformed tool name
 *
 * @example
 * // Website tools
 * transformToolName('website_tool_charity_chat_netlify_app_tab6771689_charity_search')
 * // Returns: 'charitychatnetlifyapp_tabActive_charity_search'
 *
 * @example
 * // Extension tools
 * transformToolName('extension_tool_create_bookmark')
 * // Returns: 'ext_create_bookmark'
 */
function transformToolName(originalName: string): string {
  // Handle website tools: website_tool_domain_tabXXX_action
  if (originalName.startsWith('website_tool_')) {
    // Remove the prefix
    const withoutPrefix = originalName.substring('website_tool_'.length);

    // Find the tab pattern (tab followed by numbers)
    const tabMatch = withoutPrefix.match(/_tab\d+_/);
    if (!tabMatch) return originalName; // Shouldn't happen

    const tabPattern = tabMatch[0];
    const tabIndex = withoutPrefix.indexOf(tabPattern);

    // Extract domain (everything before tab pattern) and action (everything after)
    const domain = withoutPrefix.substring(0, tabIndex).replace(/[.:]/g, '');
    const action = withoutPrefix.substring(tabIndex + tabPattern.length);

    return `${domain}_tabActive_${action}`;
  }

  // Handle extension tools: extension_tool_action
  if (originalName.startsWith('extension_tool_')) {
    const action = originalName.substring('extension_tool_'.length);
    // Find the API category (first word before underscore)
    const firstUnderscore = action.indexOf('_');
    if (firstUnderscore > 0) {
      const api = action.substring(0, firstUnderscore);
      // Don't duplicate the API name - just use the full action
      return `ext_${action}`;
    }
    return `ext_${action}`;
  }

  // This shouldn't happen based on requirements
  return originalName;
}

/**
 * Wrapper around frontendTools that applies a concise naming convention
 * and sorts tools with domain tools before extension tools.
 *
 * This function transforms verbose tool names to more readable formats:
 * - Website tools: `website_tool_domain_tabXXX_action` → `domain_tabActive_action`
 * - Extension tools: `extension_tool_action` → `ext_api_action`
 *
 * @param tools - Record of tool definitions with descriptions and JSON Schema parameters
 * @returns Transformed tools object with concise naming and sorted (domain tools first)
 *
 * @example
 * const tools = {
 *   'website_tool_localhost_5173_tab123_createTodo': {
 *     description: 'Create a new todo',
 *     parameters: { type: 'object', properties: { text: { type: 'string' } } }
 *   },
 *   'extension_tool_create_bookmark': {
 *     description: 'Create a bookmark',
 *     parameters: { type: 'object', properties: { url: { type: 'string' } } }
 *   }
 * };
 *
 * const transformed = conciseFrontendTools(tools);
 * // Result: {
 * //   'localhost5173_tabActive_createTodo': { ... },
 * //   'ext_create_bookmark': { ... }
 * // }
 */
export const conciseFrontendTools = (
  tools: Record<string, { description?: string; parameters: JSONSchema7 }>
) => {
  // Get the transformed tools from the original frontendTools
  const originalTransformed = frontendTools(tools);

  // Transform the keys and rebuild the object
  const entries = Object.entries(originalTransformed).map(([name, tool]) => [
    transformToolName(name),
    tool,
  ]) as Array<[string, any]>;

  // Sort: domain tools first, then extension tools
  entries.sort(([a], [b]) => {
    const isExtA = (a as string).startsWith('ext_');
    const isExtB = (b as string).startsWith('ext_');

    if (!isExtA && isExtB) return -1;
    if (isExtA && !isExtB) return 1;
    return (a as string).localeCompare(b as string);
  });

  return Object.fromEntries(entries);
};
