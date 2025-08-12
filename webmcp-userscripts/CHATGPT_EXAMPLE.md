# ChatGPT Userscript Development - Real Example

This demonstrates the actual workflow used to create the ChatGPT userscript.

## 1. Reconnaissance Phase

```javascript
// Using Playwright to discover elements
mcp_playwright_browser_navigate(url: "https://chatgpt.com")
mcp_playwright_browser_evaluate(function: `() => {
  const textarea = document.querySelector('textarea[name="prompt-textarea"]');
  const buttons = Array.from(document.querySelectorAll('button'));
  return {
    textarea: {
      found: !!textarea,
      name: textarea?.name,
      placeholder: textarea?.placeholder
    },
    testIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
      testId: el.getAttribute('data-testid'),
      tag: el.tagName
    }))
  };
}`)
```

**Discovered:**
- Message input: `textarea[name="prompt-textarea"]`
- Login button: `[data-testid="login-button"]`
- Model switcher: `[data-testid="model-switcher-dropdown-button"]`

## 2. Created Structure

```
scripts/chatgpt/
├── src/
│   ├── index.ts      # MCP server and tools
│   └── selectors.ts  # All discovered selectors
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 3. Key Implementation Details

### React-Compatible Text Input
```typescript
async function typeText(selector: string, text: string): Promise<boolean> {
  const element = await waitForSelector(selector);
  if (element instanceof HTMLTextAreaElement) {
    // React needs native value setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, text);
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  return false;
}
```

### Send Button Discovery
```typescript
// ChatGPT's send button is tricky - had to try multiple approaches
const sendButton = document.querySelector('button[aria-label*="Send"]') ||
                  document.querySelector('button[data-testid*="send"]') ||
                  textarea?.parentElement?.querySelector('button:not([disabled])');
```

## 4. Testing & Iteration

### Iteration 1: Basic Implementation
- **Issue**: Text typed but wouldn't send
- **Fix**: Added React-compatible event handling

### Iteration 2: Send Button
- **Issue**: Couldn't find send button
- **Fix**: Added multiple selector strategies

### Iteration 3: Debug Tool
```typescript
server.registerTool("chatgpt_debug_input", {
  description: "Debug the input textarea and send button state",
  inputSchema: {}
}, async () => {
  // Returns detailed state information
});
```

## 5. Final Working Tools

1. **chatgpt_type_message** - Types message with React compatibility
2. **chatgpt_send_message** - Sends via Enter key or button click
3. **chatgpt_get_messages** - Reads conversation messages
4. **chatgpt_get_page_state** - Returns login status, message count
5. **chatgpt_click_starter_prompt** - Clicks suggestion chips
6. **chatgpt_new_chat** - Starts fresh conversation

## 6. Complete Test Sequence

```bash
# Build
cd scripts/chatgpt && pnpm run build

# Get tab
mcp_mcp-b_call_extension_tool(toolName: "extension_tool_list_active_tabs")
# Returns: tabId: 6781923

# Inject
mcp_mcp-b_extension_tool_execute_user_script(
  filePath: "/path/to/WebMCP/webmcp-userscripts/scripts/chatgpt/dist/chatgpt.user.js",
  tabId: 6781923
)

# Verify
mcp_mcp-b_list_website_tools(domain: "chatgpt")
# Shows 15 tools registered

# Test typing
mcp_mcp-b_call_website_tool(
  toolName: "website_tool_chatgpt_com_tab6781923_chatgpt_type_message",
  arguments: { message: "Hello ChatGPT!" }
)

# Send message
mcp_mcp-b_call_website_tool(
  toolName: "website_tool_chatgpt_com_tab6781923_chatgpt_send_message"
)

# Read response
mcp_mcp-b_call_website_tool(
  toolName: "website_tool_chatgpt_com_tab6781923_chatgpt_get_last_message"
)
```

## Lessons Learned

1. **React sites need special handling** - Standard DOM events don't work
2. **Debug tools are essential** - Add them early in development
3. **Selectors change** - Use multiple strategies (testid, aria-label, position)
4. **Test incrementally** - Don't try to build everything at once
5. **Browser state matters** - Login status affects available elements

## Time Breakdown

- Reconnaissance: 5 minutes
- Initial implementation: 15 minutes
- Debugging React issues: 10 minutes
- Testing & refinement: 10 minutes
- **Total: ~40 minutes**

With this workflow, an AI can autonomously create working userscripts for most websites in under an hour.
