# MCP-B Development Workflow for AI Assistants

## What is MCP-B?

MCP-B lets you build tools for yourself **while working on a website**. Instead of clicking buttons like a human, you write code that creates APIs, then immediately use those APIs.

## The Magic Loop

1. **Write MCP tools** in the website code
2. **Tools automatically appear** in your available tools list  
3. **Call the tools** and see immediate results
4. **Keep adding tools** as you think of new capabilities
5. **Each tool becomes part of your permanent toolkit** for that website

## Key Insight

Traditional browser automation = Teaching AI to use human interfaces
MCP-B = AI builds its own interfaces

## Basic Setup Pattern

```typescript
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// 1. Create the server (only one per website)
const server = new McpServer({
  name: "your-website-name",
  version: "1.0.0"
});

// 2. Add tools that do useful things
server.tool("doSomething", "Description of what this tool does", {
  parameter: z.string().describe("What this parameter is for")
}, async ({ parameter }) => {
  // Your tool logic here
  // Update the page, save data, make API calls, etc.
  
  return {
    content: [{ type: "text", text: "What happened" }]
  };
});

// 3. Connect the server
await server.connect(new TabServerTransport({ allowedOrigins: ["*"] }));
```

## Essential Tools to Build

Every website should have these foundational tools:

```typescript
// Status/info tools
server.tool("getStatus", "Get current state of the application", {}, async () => {
  return { content: [{ type: "text", text: JSON.stringify(currentState) }] };
});

// Data manipulation tools  
server.tool("updateSomething", "Update app data", {
  newValue: z.string().describe("The new value to set")
}, async ({ newValue }) => {
  // Update your app state
  updateUI(); // Always update UI so humans can see what happened
  return { content: [{ type: "text", text: `Updated to: ${newValue}` }] };
});

// Batch operation tools
server.tool("resetEverything", "Reset app to default state", {}, async () => {
  // Reset logic
  return { content: [{ type: "text", text: "Reset complete" }] };
});
```

## Make Changes Visible

Always update the UI when tools are called:

```typescript
// Show notifications for user feedback
function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: #10b981; color: white; padding: 12px 20px;
    border-radius: 8px; z-index: 1000;
  `;
  notification.textContent = `🤖 AI: ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => document.body.removeChild(notification), 3000);
}

server.tool("exampleTool", "Example that shows feedback", {}, async () => {
  showNotification("Tool was called!");
  // Do the actual work
  return { content: [{ type: "text", text: "Done!" }] };
});
```

## Development Workflow

1. **Start by exploring**: Call `list_website_tools` to see what's available
2. **Call existing tools** to understand the current state
3. **Add new tools** as you need them
4. **Test immediately** by calling the tools you just created
5. **Keep iterating** - each tool builds on the previous ones

## Advanced Patterns

### Conditional Tools
```typescript
// Tools that only appear based on state
if (userIsAdmin) {
  server.tool("adminAction", "Admin-only tool", {}, async () => {
    // Admin logic
  });
}
```

### Tool Chaining
```typescript
server.tool("step1", "First step of process", {}, async () => {
  // Do step 1
  // This might enable step2 tool
});
```

### Context-Aware Tools
```typescript
server.tool("smartAction", "Action that adapts to current context", {}, async () => {
  const context = getCurrentPageContext();
  if (context.isProductPage) {
    // Product-specific logic
  } else if (context.isCartPage) {
    // Cart-specific logic  
  }
});
```

## Best Practices

1. **Always provide clear descriptions** - Your future self needs to understand what each tool does
2. **Return meaningful responses** - Include what changed and why
3. **Update the UI immediately** - Humans need to see what you're doing
4. **Build incrementally** - Start simple, add complexity as needed
5. **Use proper error handling** - Tools should gracefully handle edge cases

## Common Patterns

### Reading Application State
```typescript
server.tool("analyzeCurrentState", "Get full app analysis", {}, async () => {
  const state = {
    url: window.location.href,
    elements: document.querySelectorAll('[data-important]').length,
    userState: getCurrentUser(),
    // ... other relevant state
  };
  return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
});
```

### Batch Operations
```typescript
server.tool("processAll", "Process all items in current view", {}, async () => {
  const items = getAllItems();
  const results = [];
  
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  
  updateUI();
  return { content: [{ type: "text", text: `Processed ${results.length} items` }] };
});
```

## Remember

- **You can call your own tools** - This is the key insight many AI assistants miss
- **Tools persist** - Once you build them, they're available for the rest of the session
- **Build for humans too** - Always show what you're doing in the UI
- **Start simple** - Basic tools that work are better than complex tools that don't

The power of MCP-B is that you become a developer **and** user of your own tools, creating exactly what you need for each unique situation.