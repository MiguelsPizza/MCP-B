# WebMCP Userscript Development Guide

A comprehensive guide for developing, testing, and debugging WebMCP userscripts that inject MCP-B servers into websites for browser automation.

## Quick Reference (TL;DR)

### Core Workflow
You are an AI operating a real browser via two tool layers:
1. **Extension tools** (browser-level): list tabs, execute scripts, take screenshots
2. **Website tools** (page-level): appear after userscript injection, site-specific

### Essential Flow
```
1. List extension tools → Find active tab → Inject userscript → List website tools → Call them
2. Build command: cd scripts/[site] && pnpm build
3. Inject: extension_tool_execute_user_script with absolute path + tabId
4. Verify: list website tools for domain
```

### Key Constraints
- **Always verify which tools exist** before assuming functionality
- **Tab IDs change frequently** - re-discover before acting
- **Use absolute paths** for file references
- **Tools may not appear immediately** - reload tab and wait if needed
- **Script registration is persistent** - once registered, scripts auto-run on matching URLs
- **Permission gates can be eliminated** - avoid upgrade_permissions by defaulting writeEnabled = true

### Mini-Playbooks

**Inject and stop:**
```
List active tabs → get tabId → execute user script with filePath + tabId → stop
```

**Verify tools:**
```
List website tools for domain. If empty, reload tab, wait 1-2s, list again
```

**Compose draft (Gmail example):**
```
Call compose_new_email with arrays for recipients (no permissions needed if designed right)
```

**Register script permanently:**
```
extension_tool_userscripts_register with filePath, id, matches, runAt: "document_start", world: "MAIN"
```

---

## Complete Development Workflow

### Phase 1: Initial Setup & Reconnaissance

#### Navigate and Explore
```javascript
// Navigate to target website with Playwright
mcp_playwright_browser_navigate(url: "https://example.com")

// Take snapshot to understand page structure
mcp_playwright_browser_snapshot()

// Comprehensive selector discovery
mcp_playwright_browser_evaluate(function: `() => {
  // Find all interactive elements
  const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
  const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
  const forms = Array.from(document.querySelectorAll('form'));

  return {
    inputs: inputs.map(el => ({
      type: el.type,
      name: el.name,
      id: el.id,
      className: el.className,
      placeholder: el.placeholder,
      selector: el.id ? \`#\${el.id}\` : el.className ? \`.\${el.className.split(' ')[0]}\` : el.tagName.toLowerCase()
    })),
    buttons: buttons.map(el => ({
      text: el.textContent.trim(),
      ariaLabel: el.getAttribute('aria-label'),
      className: el.className,
      selector: el.id ? \`#\${el.id}\` : el.getAttribute('aria-label') ? \`[aria-label*="\${el.getAttribute('aria-label')}"]\` : null
    })),
    dataTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
      testId: el.getAttribute('data-testid'),
      tag: el.tagName.toLowerCase()
    }))
  };
}`)
```

### Phase 2: Create Directory Structure

```bash
cd /path/to/WebMCP/webmcp-userscripts
mkdir -p scripts/[sitename]/src
cd scripts/[sitename]
```

#### Create selectors.ts
```typescript
// scripts/[sitename]/src/selectors.ts
/**
 * Selectors for [SiteName] automation
 * Discovered via Playwright reconnaissance
 * AI: Use these selectors for reliable element targeting
 */
export const SiteSelectors = {
  // Group selectors by functionality for AI clarity
  auth: {
    loginButton: '[data-testid="login"]',  // Main login button
    logoutLink: 'a[href*="logout"]',       // Logout link in menu
  },
  navigation: {
    homeLink: 'a[aria-label="Home"]',      // Home navigation
    searchBox: 'input[name="search"]',     // Global search input
  },
  // Add more groups based on reconnaissance
};

// Helper function for waiting for elements
export async function waitForSelector(selector: string, timeout: number = 5000): Promise<Element | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}
```

#### Create package.json
```json
{
  "name": "@webmcp-userscripts/[sitename]-injector",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build"
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

#### Create vite.config.ts
```typescript
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: '[SiteName] MCP-B Injector',
        namespace: 'https://github.com/WebMCP-org/webmcp-userscripts',
        match: ['https://[sitedomain.com]/*'],
        version: '1.0.0',
        description: 'MCP-B tools for [SiteName]',
        grant: ['GM.info', 'unsafeWindow'],
      },
      build: {
        fileName: '[sitename].user.js',
        metaFileName: true,
      }
    })
  ],
  build: { minify: false }
});
```

### Phase 3: Implement MCP Tools

#### Create index.ts with MCP server
```typescript
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SiteSelectors, waitForSelector } from './selectors.js';

const server = new McpServer({
  name: '[SiteName] MCP Server',
  version: '1.0.0',
},{
  capabilities: {
    tools: { listChanged: true },
  },
});

// Helper for React apps - CRITICAL for many modern sites
async function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  )?.set || Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

// ALWAYS include a debug tool
server.registerTool("sitename_debug",
  {
    description: "Debug page state and element availability",
    inputSchema: {}
  },
  async () => {
    const debugInfo = {
      url: window.location.href,
      title: document.title,
      elements: {
        // Check for key elements from selectors
        loginButton: !!document.querySelector(SiteSelectors.auth.loginButton),
        searchBox: !!document.querySelector(SiteSelectors.navigation.searchBox),
      },
      reactDetected: !!(window as any).React || !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
      cookies: document.cookie.split(';').map(c => c.split('=')[0].trim()),
    };
    return {
      content: [{
        type: "text",
        text: JSON.stringify(debugInfo, null, 2)
      }]
    };
  }
);

// Example action tool
server.registerTool("sitename_search",
  {
    description: "Search for content",
    inputSchema: {
      query: z.string().describe("Search query")
    }
  },
  async ({ query }) => {
    const searchBox = await waitForSelector(SiteSelectors.navigation.searchBox);
    if (searchBox instanceof HTMLInputElement) {
      await setReactValue(searchBox, query);
      searchBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      return {
        content: [{
          type: "text",
          text: `Searched for: ${query}`
        }]
      };
    }
    return {
      content: [{
        type: "text",
        text: "Search box not found",
        isError: true
      }]
    };
  }
);

// Connect transport
const transport = new TabServerTransport({ allowedOrigins: ['*'] });
await server.connect(transport);

console.log('[MCP-B] Server initialized with tools:', server.getTools());
```

### Phase 4: Build & Test Cycle

#### Build the userscript
```bash
cd /path/to/WebMCP/webmcp-userscripts/scripts/[sitename]
pnpm install
pnpm run build
```

#### Test with WebMCP Extension

1. **Find the target tab**
```javascript
mcp_mcp-b_call_extension_tool(toolName: "extension_tool_list_active_tabs")
// Note the tabId for your target site
```

2. **Inject the built userscript**
```javascript
mcp_mcp-b_extension_tool_execute_user_script(
  filePath: "/path/to/WebMCP/webmcp-userscripts/scripts/[sitename]/dist/[sitename].user.js",
  tabId: [obtained_tab_id]
)
// Success returns documentId/frameId with result: null
```

3. **Verify tools are registered**
```javascript
mcp_mcp-b_list_website_tools(domain: "[sitedomain]")
// Should show your registered tools
```

4. **Test each tool**
```javascript
mcp_mcp-b_call_website_tool(
  toolName: "website_tool_[domain]_com_tab[id]_[toolname]",
  arguments: { /* tool specific args */ }
)
```

### Phase 5: Debugging & Iteration

#### Common Issues and Solutions

**Tools not appearing:**
1. Reload the tab and wait for page load
2. Wait 1-2 seconds for script initialization
3. List website tools again
4. Check browser console for errors
5. Verify script was actually registered: `extension_tool_userscripts_get_all`

**Old tools still showing after updates:**
- Browser may cache the old script
- Force reload the tab: `extension_tool_reload_tab`
- Re-inject the updated script
- Check tools list shows new descriptions/counts

**React text input not working:**
```typescript
// Always use the setReactValue helper
async function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  )?.set || Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
```

**Elements not found:**
- Use the debug tool to check element availability
- Try multiple selector strategies
- Add waitForSelector with appropriate timeout

#### Iteration Cycle
1. Identify issue from test results
2. Modify code in src/index.ts
3. Rebuild: `pnpm run build`
4. Re-inject the script
5. Test again

### Phase 6: Production Deployment

#### Permanent Script Registration
Once your userscript is tested and working, register it permanently:

```javascript
// Register for automatic execution on all matching pages
mcp_mcp-b_extension_tool_userscripts_register({
  filePath: "/absolute/path/to/scripts/[sitename]/dist/[sitename].user.js",
  id: "[sitename]-mcp-server",
  matches: ["https://[domain]/*"],
  runAt: "document_start",  // Load immediately for best UX
  world: "MAIN"            // Full page access for MCP integration
})
```

**Benefits of Registration:**
- ✅ **Auto-activation**: Script runs on every page load
- ✅ **No manual injection**: Seamless user experience
- ✅ **Cross-session persistence**: Survives browser restarts
- ✅ **Multi-tab support**: Each tab gets independent tools

#### User Experience Optimization

**Eliminate Permission Friction:**
```typescript
// BAD: Requires user interaction
private writeEnabled = false;
// ... register upgrade_permissions tool

// GOOD: Enable by default
private writeEnabled = true;
// No permission gates needed
```

**Focus on Essential Tools:**
- Remove debug/admin tools from production
- Keep only user-facing functionality
- Simplify tool descriptions
- Use clear, action-oriented names

**Example: Gmail Simplified**
```typescript
// Before: 16 tools including get_user_info, get_gmail_settings, etc.
// After: 12 essential tools focused on reading and composing emails

const essentialTools = [
  'list_visible_emails',    // Core reading
  'compose_new_email',      // Core writing
  'search_emails',          // Essential navigation
  'get_unread_counts'       // Useful context
];
```

### Phase 7: Advanced Patterns

#### Handle Dynamic Content
```typescript
async function waitForAndClick(selector: string): Promise<boolean> {
  const element = await waitForSelector(selector);
  if (element instanceof HTMLElement) {
    element.click();
    return true;
  }
  return false;
}
```

#### Handle Authentication States
```typescript
server.registerTool("check_auth_state",
  {
    description: "Check if user is logged in",
    inputSchema: {}
  },
  async () => {
    const isLoggedIn = !!document.querySelector('[data-testid="user-menu"]');
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ isLoggedIn })
      }]
    };
  }
);
```

#### Handle Forms
```typescript
server.registerTool("fill_form",
  {
    description: "Fill and submit a form",
    inputSchema: {
      formData: z.record(z.string()).describe("Key-value pairs for form fields")
    }
  },
  async ({ formData }) => {
    for (const [name, value] of Object.entries(formData)) {
      const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement;
      if (input) {
        await setReactValue(input, value);
      }
    }
    // Submit logic
  }
);
```

## Best Practices

### Selector Strategy
1. **Prefer data-testid attributes** (most stable)
2. **Use aria-label** for accessibility elements
3. **Avoid brittle class-based selectors**
4. **Create fallback selectors**

### Error Handling
- Always check if elements exist before interaction
- Return meaningful error messages with `isError: true`
- Use try-catch blocks for async operations

### React Compatibility
- Use native value setters for inputs
- Trigger proper synthetic events
- Click buttons rather than keyboard shortcuts
- Check for React with `window.React` or `__REACT_DEVTOOLS_GLOBAL_HOOK__`

### Tool Schema Design
**Use Arrays for Email Addresses:**
```typescript
// GOOD: Allows multiple recipients
to: z.array(z.string().email()).min(1).describe('Email recipients')

// BAD: Only single recipient
to: z.string().email().describe('Email recipient')
```

**Provide Sensible Defaults:**
```typescript
// GOOD: Optional with default
send: z.boolean().default(false).describe('Send immediately')

// BAD: Always required
send: z.boolean().describe('Send immediately')
```

**Clear Tool Descriptions:**
```typescript
// GOOD: Explains what it does and context
description: 'List visible emails/threads from current Gmail view (inbox). Shows email summaries.'

// BAD: Too brief
description: 'Get emails'
```

### Testing Strategy
1. Create debug tools first
2. Test each tool in isolation
3. Verify state changes after actions
4. Use browser DevTools console for additional debugging

### Performance
- Use waitForSelector with reasonable timeouts (5000ms default)
- Avoid polling when possible
- Batch related operations

## Troubleshooting Checklist

- [ ] **Tools not appearing?** → Reload tab, wait 2 seconds, verify registration with `get_all`
- [ ] **React events not working?** → Use setReactValue helper
- [ ] **Selectors not found?** → Use debug tool to inspect DOM
- [ ] **Permissions errors?** → Remove upgrade_permissions, default writeEnabled = true
- [ ] **Tab ID invalid?** → Re-fetch active tabs before use
- [ ] **Script won't inject?** → Verify absolute path, rebuild if needed
- [ ] **Old tools persisting?** → Force reload tab, clear cache, re-inject
- [ ] **Array schema errors?** → Check tool expects arrays for recipients/multi-values
- [ ] **Tool descriptions confusing?** → Add context about current page/state
- [ ] **Multiple tabs conflicting?** → Each tab gets unique tool names with tabId

## Complete Example Flow

### Development to Production (Gmail Real Example)

```bash
# 1. Development & Testing
cd /Users/alexmnahas/personalRepos/WebMCP/webmcp-userscripts/scripts/gmail
npm run build

# 2. Get active tab
mcp_mcp-b_call_extension_tool(toolName: "extension_tool_create_tab", arguments: {"url": "https://mail.google.com"})
# Result: tab 6782493

# 3. Inject and test
mcp_mcp-b_extension_tool_execute_user_script(
  filePath: "/Users/alexmnahas/personalRepos/WebMCP/webmcp-userscripts/scripts/gmail/dist/gmail.user.js",
  tabId: 6782493
)

# 4. Verify tools
mcp_mcp-b_list_website_tools(domain: "google")
# Result: 12 simplified tools

# 5. Test functionality
mcp_mcp-b_call_website_tool(
  toolName: "website_tool_mail_google_com_tab6782493_compose_new_email",
  arguments: {"to": ["test@example.com"], "subject": "Test", "body": "Hello!", "send": false}
)
# Result: Success!

# 6. Register for production
mcp_mcp-b_extension_tool_userscripts_register({
  filePath: "/Users/alexmnahas/personalRepos/WebMCP/webmcp-userscripts/scripts/gmail/dist/gmail.user.js",
  id: "gmail-mcp-simplified",
  matches: ["https://mail.google.com/*"],
  runAt: "document_start",
  world: "MAIN"
})

# 7. Verify auto-registration
mcp_mcp-b_call_extension_tool(toolName: "extension_tool_create_tab", arguments: {"url": "https://mail.google.com"})
# New tab automatically has tools available!
```

### Quick Development Flow
```bash
# 1. Reconnaissance with Playwright
mcp_playwright_browser_navigate(url: "https://example.com")
mcp_playwright_browser_snapshot()

# 2. Create script structure
cd /path/to/WebMCP/webmcp-userscripts
mkdir -p scripts/example/src
cd scripts/example

# 3. Create files (selectors.ts, index.ts, package.json, vite.config.ts)

# 4. Install and build
pnpm install
pnpm run build

# 5. Inject and test
# Get tab ID
mcp_mcp-b_call_extension_tool(toolName: "extension_tool_list_active_tabs")

# Inject script
mcp_mcp-b_extension_tool_execute_user_script(
  filePath: "/path/to/WebMCP/webmcp-userscripts/scripts/example/dist/example.user.js",
  tabId: 12345
)

# List tools
mcp_mcp-b_list_website_tools(domain: "example")

# Test tools
mcp_mcp-b_call_website_tool(toolName: "website_tool_example_com_tab12345_example_action")
```

## Success Criteria

The userscript is complete when:
- ✅ All major UI elements have corresponding tools
- ✅ Tools execute successfully without errors
- ✅ State changes are properly reflected
- ✅ Error cases return helpful messages
- ✅ Debug tool provides useful diagnostics

## Time Estimates

**Development (First Time):**
- Reconnaissance: 5 minutes
- Setup: 2 minutes
- Core tools: 15-20 minutes
- Build & deploy: 1 minute
- Testing cycle: 5 minutes per iteration (2-3 iterations typical)
- **Total: 45-90 minutes for complex sites**

**Development (Experienced):**
- Simple sites: 15-30 minutes
- Complex sites: 30-60 minutes
- **Production deployment: +5 minutes (simplification + registration)**

**Production Polish (Based on Gmail Experience):**
- Remove permission gates: 5 minutes
- Simplify tool set: 10-15 minutes
- Test simplified version: 5 minutes
- Register script permanently: 2 minutes
- **Total Polish Time: 20-25 minutes**

Remember: The key to success is iterative development. Start simple, test frequently, gradually add complexity, then simplify for production. **The Gmail example went from 16 tools to 12 focused tools, eliminating all permission friction.**