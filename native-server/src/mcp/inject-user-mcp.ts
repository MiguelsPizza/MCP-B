/*
This file holds an MCP tool which is bit different from the rest of the tools.
This tool reads the specified file from the users machine and injects it into the specifed tab.
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