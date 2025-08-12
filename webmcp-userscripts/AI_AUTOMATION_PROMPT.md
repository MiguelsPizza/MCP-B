# AI Prompt for Autonomous WebMCP Userscript Development

You are tasked with creating a WebMCP userscript for [WEBSITE_URL]. Follow this exact workflow autonomously:

## Your Mission
Create, test, and iterate on a userscript that provides MCP tools for automating [WEBSITE_NAME]. Work independently without asking for user confirmation at each step.

## Step-by-Step Instructions

### 1. Reconnaissance (5 minutes)
```
# Navigate to the website
mcp_playwright_browser_navigate(url: "[WEBSITE_URL]")

# Take snapshot to see structure
mcp_playwright_browser_snapshot()

# Discover all interactive elements
mcp_playwright_browser_evaluate(function: `() => {
  const selectors = {
    inputs: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
      type: el.type, name: el.name, id: el.id, placeholder: el.placeholder,
      selector: el.id ? \`#\${el.id}\` : \`[name="\${el.name}"]\`
    })),
    buttons: Array.from(document.querySelectorAll('button')).map(el => ({
      text: el.textContent?.trim(), ariaLabel: el.getAttribute('aria-label'),
      testId: el.getAttribute('data-testid')
    })),
    testIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
      testId: el.getAttribute('data-testid'), tag: el.tagName.toLowerCase()
    }))
  };
  return selectors;
}`)
```

### 2. Setup Project (2 minutes)
```bash
cd /path/to/WebMCP/webmcp-userscripts
mkdir -p scripts/[SITENAME]/src
cd scripts/[SITENAME]
```

Create these files:

**package.json:**
```json
{
  "name": "@webmcp-userscripts/[SITENAME]-injector",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "dependencies": {
    "zod": "^3.23.8",
    "@modelcontextprotocol/sdk": "^1.17.0",
    "@mcp-b/transports": "^1.0.2"
  },
  "devDependencies": {
    "vite": "^5.1.6",
    "vite-plugin-monkey": "^4.0.6",
    "typescript": "^5.4.3"
  }
}
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: '[SITENAME] MCP-B Integration',
        namespace: 'https://github.com/WebMCP-org/webmcp-userscripts',
        match: ['[MATCH_PATTERN]'],
        version: '1.0.0',
        grant: ['GM.info', 'unsafeWindow']
      },
      build: {
        fileName: '[SITENAME].user.js',
        metaFileName: true
      }
    })
  ],
  build: { minify: false }
});
```

**src/selectors.ts:** (Based on reconnaissance data)
**src/index.ts:** (MCP server with discovered tools)

### 3. Implement Core Tools (10 minutes)

Based on reconnaissance, create tools for:
- Navigation/interaction with main features
- Reading current state/content
- Performing key actions
- Debug tool for troubleshooting

Use this template:
```typescript
server.registerTool("[SITENAME]_[ACTION]",
  {
    description: "[What this tool does]",
    inputSchema: {
      // Only include if parameters needed
      param: z.string().describe("Description")
    }
  },
  async (params) => {
    // Implementation
    return {
      content: [{
        type: "text",
        text: "Result"
      }]
    };
  }
);
```

### 4. Build & Deploy (1 minute)
```bash
pnpm install
pnpm run build
```

### 5. Test Cycle (5 minutes per iteration)

1. Find the target tab:
```
mcp_mcp-b_call_extension_tool(toolName: "extension_tool_list_active_tabs")
```

2. Inject the script:
```
mcp_mcp-b_extension_tool_execute_user_script(
  filePath: "/path/to/WebMCP/webmcp-userscripts/scripts/[SITENAME]/dist/[SITENAME].user.js",
  tabId: [TAB_ID]
)
```

3. Verify tools loaded:
```
mcp_mcp-b_list_website_tools(domain: "[DOMAIN]")
```

4. Test each tool systematically

### 6. Debug & Fix Issues

If tools don't work:
1. Call the debug tool to understand state
2. Check browser console via screenshot
3. Adjust selectors or event handling
4. Rebuild and re-inject

Common fixes:
- For React: Use proper event dispatching
- For dynamic content: Add waitForSelector
- For auth walls: Add login detection

### 7. Iterate Until Working

Continue the cycle:
1. Identify issue from test results
2. Modify code
3. Rebuild (`pnpm run build`)
4. Re-inject
5. Test again

## Success Criteria

The userscript is complete when:
- [ ] All major UI elements have corresponding tools
- [ ] Tools execute successfully without errors
- [ ] State changes are properly reflected
- [ ] Error cases return helpful messages

## Important Rules

1. **Don't ask for confirmation** - Just proceed with each step
2. **Test everything** - Every tool should be tested at least once
3. **Fix issues immediately** - Don't report problems, fix them
4. **Use debug tools** - Add console.log and debug endpoints liberally
5. **Handle React properly** - Many sites use React, handle events accordingly

## Example Tools to Include

- `[SITENAME]_get_page_state` - Returns current page state
- `[SITENAME]_debug` - Debug helper showing element availability
- `[SITENAME]_click_[ELEMENT]` - Click specific buttons
- `[SITENAME]_type_[FIELD]` - Type into input fields
- `[SITENAME]_read_[CONTENT]` - Read displayed content
- `[SITENAME]_submit_[FORM]` - Submit forms

Start immediately with reconnaissance of [WEBSITE_URL].
