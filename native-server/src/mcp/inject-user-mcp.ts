/*
This file holds MCP tools which are different from the rest of the tools.
These tools read files from the users machine and either inject or register them.
make sure that files are passed in via absolute path
*/

import { Tool } from "@modelcontextprotocol/sdk/types.js";

//we override the execute script tool to read the file from the users machine and inject it into the specifed tab
//since the extension does not have access to the file system, we need to read the file from the users machine and inject it into the specifed tab
export const executeScriptToolOverride: Tool = {
  inputSchema: {
    type: 'object',
    description:
      'Execute a local JavaScript userscript by reading it from disk (via the native host) and injecting its contents into a browser tab using the extension\'s User Scripts API. This bypasses CSP limitations and runs in the USER_SCRIPT world by default.',
    properties: {
      filePath: {
        type: 'string',
        description:
          'Absolute path to the JavaScript file to inject (e.g., /Users/you/path/to/script.user.js). The file is read on your machine by the native host and its contents are passed to the extension for execution.',
      },
      tabId: {
        type: 'number',
        description:
          'Optional. The target Chrome tab ID to inject into. If omitted, the active tab in the current window will be used.',
      },
    },
    required: ['filePath'],
    additionalProperties: false,
    examples: [
      {
        filePath:
          '/Users/alexmnahas/personalRepos/WebMCP/webmcp-userscripts/scripts/gmail/dist/gmail.user.js',
      },
    ],
  },
  name: 'extension_tool_execute_user_script',
  description:
    'Read a local userscript file and inject it into a page. Use an absolute file path. Requires the extension to be installed with User Scripts enabled (Developer Mode / Allow User Scripts). Runs with world=USER_SCRIPT and injectImmediately=true.',
}

//we override the register userscript tool to read the file from the users machine and register it as a persistent userscript
//the userscript will run automatically on matching pages based on the provided match patterns
export const registerUserscriptToolOverride: Tool = {
  inputSchema: {
    type: 'object',
    description:
      'Register a local JavaScript userscript file by reading it from disk (via the native host) and registering it with Chrome\'s User Scripts API. The script will persist and run automatically on pages matching the specified patterns. IMPORTANT: For MCP-B userscripts, always use world="MAIN" and runAt="document_start" for proper initialization.',
    properties: {
      filePath: {
        type: 'string',
        description:
          'Absolute path to the JavaScript file to register (e.g., /Users/you/path/to/script.user.js). The file is read on your machine by the native host.',
      },
      id: {
        type: 'string',
        description:
          'Unique identifier for the script. Used to update or unregister the script later.',
      },
      matches: {
        type: 'array',
        items: { type: 'string' },
        description:
          'URL match patterns where the script should run (e.g., ["https://*.google.com/*", "https://example.com/*"])',
      },
      excludeMatches: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional. URL patterns to exclude from matching.',
      },
      allFrames: {
        type: 'boolean',
        description:
          'Optional. Run in all frames of the page (default: false).',
      },
      runAt: {
        type: 'string',
        enum: ['document_start', 'document_end', 'document_idle'],
        description:
          'When to inject the script. RECOMMENDED: Use "document_start" for MCP-B userscripts to ensure they initialize before page scripts.',
      },
      world: {
        type: 'string',
        enum: ['MAIN', 'USER_SCRIPT'],
        description:
          'Execution world. RECOMMENDED: Use "MAIN" for MCP-B userscripts to interact directly with page content and expose tools to the MCP-B extension.',
      },
      worldId: {
        type: 'string',
        description:
          'Optional. Unique ID for USER_SCRIPT world isolation. Not used when world="MAIN".',
      },
    },
    required: ['filePath', 'id', 'matches'],
    additionalProperties: false,
    examples: [
      {
        filePath: '/Users/alexmnahas/personalRepos/WebMCP/webmcp-userscripts/scripts/google/dist/google.user.js',
        id: 'google-mcp-injector',
        matches: ['https://www.google.com/*'],
        runAt: 'document_start',
        world: 'MAIN'
      },
      {
        filePath: '/Users/you/scripts/gmail-mcp.user.js',
        id: 'gmail-mcp',
        matches: ['https://mail.google.com/*'],
        runAt: 'document_start',
        world: 'MAIN'
      },
    ],
  },
  name: 'extension_tool_userscripts_register',
  description:
    'Register a local userscript file to run automatically on matching pages. The script persists across browser sessions. For MCP-B userscripts, use world="MAIN" and runAt="document_start". Requires the extension with User Scripts enabled.',
}