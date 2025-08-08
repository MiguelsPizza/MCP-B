# MCP Connector Extension Example

A complete example demonstrating how to build a Chrome extension that connects to the MCP-B extension and interacts with its tools using the Model Context Protocol (MCP).

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Code Examples](#code-examples)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Features

- 🔌 **Cross-Extension Communication** - Connect to MCP-B via Chrome runtime ports
- 🛠️ **Tool Discovery** - List and filter available MCP tools
- 🔄 **Dynamic Updates** - Real-time tool list updates when websites register tools
- 📦 **Tool Execution** - Call tools with custom JSON arguments
- 🎨 **React UI** - Clean popup interface with Tailwind CSS
- ♻️ **Auto-Reconnect** - Automatic connection on extension install/startup
- 📊 **Category Filtering** - Separate extension and website tools

## Quick Start

### Prerequisites

1. **MCP-B Extension** - Install and enable the MCP-B extension
2. **Node.js & pnpm** - Required for building the extension

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd examples/extension-connector

# Install dependencies (isolated from monorepo)
pnpm install --ignore-workspace

# Build the extension
pnpm build
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3` directory
5. The extension icon will appear in your toolbar

### Configuration

Update the MCP-B extension ID in `entrypoints/background.ts`:

```typescript
const TARGET_EXTENSION_ID = 'your-mcpb-extension-id-here';
```

Find your MCP-B extension ID at `chrome://extensions/`

## Architecture

### Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Popup UI      │────────▶│  Background      │────────▶│   MCP-B      │
│   (React)       │◀────────│  Service Worker  │◀────────│  Extension   │
└─────────────────┘         └──────────────────┘         └──────────────┘
     Chrome                      Persistent                 Cross-Extension
     Messages                    MCP Client                 Runtime Port
```

### Why Background Script as Proxy?

The background service worker acts as a proxy between the popup and MCP-B for critical reasons:

1. **Chrome Security Model**
   - Only background scripts can use `chrome.runtime.connectExternal`
   - Popup scripts cannot directly connect to other extensions
   - Content scripts have even more restrictions

2. **Persistent Connection**
   - Popups are ephemeral - destroyed when closed
   - Background maintains persistent MCP connections
   - Connection survives popup close/reopen cycles

3. **Message Routing**
   - Translates between Chrome messages and MCP protocol
   - Manages connection lifecycle
   - Provides stable API for the popup

### Component Details

#### Background Service Worker (`entrypoints/background.ts`)

The heart of the extension, managing all MCP communication:

```typescript
// Key responsibilities:
- Creates ExtensionClientTransport for cross-extension communication
- Initializes MCP Client with extension identity
- Handles tool list change notifications
- Proxies tool execution requests
- Stores state in Chrome storage
```

**Key Features:**
- Auto-connects on install/startup
- Listens for `notifications/tools/list_changed` events
- Maintains connection state persistently
- Handles all MCP protocol operations

#### Popup UI (`entrypoints/popup/App.tsx`)

React-based user interface for tool interaction:

```typescript
// Main features:
- Real-time connection status display
- Tool categorization (All/Extension/Website)
- JSON argument editor
- Result display with error handling
- Chrome storage integration
```

**State Management:**
- Uses React hooks for local state
- Syncs with Chrome storage for persistence
- Listens for real-time updates via Chrome messages

#### Transport Layer

Uses `@mcp-b/transports` package:

```typescript
const transport = new ExtensionClientTransport({
  extensionId: TARGET_EXTENSION_ID,
  portName: 'mcp', // Must match MCP-B's expected port
});
```

## API Reference

### Message Types

The background script accepts these message types from the popup:

#### CONNECT
Establishes connection to MCP-B extension.

```typescript
// Request
{ type: 'CONNECT' }

// Response
{ success: true } | { error: string }
```

#### DISCONNECT
Closes connection to MCP-B extension.

```typescript
// Request
{ type: 'DISCONNECT' }

// Response
{ success: true }
```

#### LIST_TOOLS
Fetches all available tools.

```typescript
// Request
{ type: 'LIST_TOOLS' }

// Response
{ 
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: any;
  }>
}
```

#### CALL_TOOL
Executes a specific tool.

```typescript
// Request
{ 
  type: 'CALL_TOOL',
  toolName: string,
  arguments: object
}

// Response
{ result: any } | { error: string }
```

### Chrome Storage Schema

The extension uses Chrome storage for state persistence:

```typescript
// Connection Status
{
  connectionStatus: {
    connected: boolean;
    extensionId: string;
    error?: string;
  }
}

// Available Tools
{
  availableTools: Tool[]
}
```

### Real-time Updates

The popup receives tool updates via Chrome runtime messages:

```typescript
// Tool list update notification
{
  type: 'TOOLS_UPDATED',
  tools: Tool[]
}
```

## Code Examples

### Connecting to MCP-B

```typescript
// In your background script
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new ExtensionClientTransport({
  extensionId: 'mcpb-extension-id',
  portName: 'mcp',
});

const client = new Client({
  name: 'Your-Extension',
  version: '1.0.0',
});

await client.connect(transport);
```

### Listening for Tool Updates

```typescript
// Set up notification handler
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
  const { tools } = await client.listTools();
  console.log('Tools updated:', tools);
  // Update UI or storage
});
```

### Calling a Tool

```typescript
// Execute a tool with arguments
const result = await client.callTool({
  name: 'extension_tabs_create',
  arguments: { url: 'https://example.com' }
});
```

### React Component Integration

```typescript
// In your React component
const [tools, setTools] = useState<Tool[]>([]);

useEffect(() => {
  // Listen for tool updates
  const handleMessage = (message: any) => {
    if (message.type === 'TOOLS_UPDATED') {
      setTools(message.tools);
    }
  };
  
  chrome.runtime.onMessage.addListener(handleMessage);
  
  return () => {
    chrome.runtime.onMessage.removeListener(handleMessage);
  };
}, []);
```

## Troubleshooting

### Common Issues

#### Cannot Connect to MCP-B

**Symptoms:** Connection fails with error message

**Solutions:**
1. Verify MCP-B extension is installed and enabled
2. Check extension ID matches in `background.ts`
3. Look for errors in both extensions' background pages
4. Ensure both extensions have proper permissions

#### Tools Not Appearing

**Symptoms:** Tool list is empty despite connection

**Solutions:**
1. Verify connection status is green/connected
2. Click "Refresh" to manually update tool list
3. Check if MCP-B has any registered tools
4. Open a website that registers MCP tools
5. Check console logs for notification handler errors

#### "Access to native messaging host forbidden"

**Symptoms:** Error in console about native messaging

**Solutions:**
- This is expected if native messaging isn't configured
- Extension will still work for browser-based tools
- To enable native messaging, follow MCP-B setup guide

### Debugging Tips

1. **Enable Developer Mode**
   ```
   chrome://extensions/ → Developer mode ON
   ```

2. **Inspect Background Page**
   ```
   Extension card → "Inspect views: service worker"
   ```

3. **Check Popup Console**
   ```
   Right-click popup → Inspect
   ```

4. **Monitor Chrome Storage**
   ```javascript
   chrome.storage.local.get(null, console.log);
   ```

5. **Test Tool Discovery**
   ```javascript
   // In background console
   const { tools } = await mcpClient.listTools();
   console.log(tools);
   ```

## Advanced Topics

### Building Custom Tool Wrappers

Create type-safe wrappers for frequently used tools:

```typescript
// lib/tools/tabs.ts
export class TabsAPI {
  private sendMessage: (msg: any) => Promise<any>;
  
  constructor(sendMessage: (msg: any) => Promise<any>) {
    this.sendMessage = sendMessage;
  }
  
  async create(url: string) {
    return this.sendMessage({
      type: 'CALL_TOOL',
      toolName: 'extension_tabs_create',
      arguments: { url }
    });
  }
  
  async update(tabId: number, updateProperties: object) {
    return this.sendMessage({
      type: 'CALL_TOOL',
      toolName: 'extension_tabs_update',
      arguments: { tabId, updateProperties }
    });
  }
}
```

### Implementing Tool Favorites

Store frequently used tools:

```typescript
// In popup component
const [favorites, setFavorites] = useState<string[]>([]);

useEffect(() => {
  chrome.storage.sync.get(['favorites'], (data) => {
    setFavorites(data.favorites || []);
  });
}, []);

const toggleFavorite = (toolName: string) => {
  const updated = favorites.includes(toolName)
    ? favorites.filter(f => f !== toolName)
    : [...favorites, toolName];
  
  setFavorites(updated);
  chrome.storage.sync.set({ favorites: updated });
};
```

### Adding Execution History

Track tool execution history:

```typescript
interface HistoryEntry {
  toolName: string;
  arguments: any;
  result: any;
  timestamp: number;
}

const [history, setHistory] = useState<HistoryEntry[]>([]);

const executeToolWithHistory = async (toolName: string, args: any) => {
  const result = await callTool(toolName, args);
  
  const entry: HistoryEntry = {
    toolName,
    arguments: args,
    result,
    timestamp: Date.now()
  };
  
  setHistory(prev => [entry, ...prev].slice(0, 50)); // Keep last 50
  chrome.storage.local.set({ history: [entry, ...history] });
  
  return result;
};
```

### Streaming Tool Results

For tools that support streaming:

```typescript
// In background script
const streamHandler = (chunk: any) => {
  chrome.runtime.sendMessage({
    type: 'TOOL_STREAM_CHUNK',
    chunk
  });
};

// Set up streaming for specific tools
if (toolName.includes('stream')) {
  client.callTool({
    name: toolName,
    arguments: args,
    onStream: streamHandler
  });
}
```

## Extension Patterns

### Pattern 1: AI Agent Controller

Use this pattern to build AI agent extensions:

```typescript
class AgentController {
  async executeTask(task: string) {
    // 1. Parse task intent
    const intent = await this.parseIntent(task);
    
    // 2. Find matching tools
    const tools = await this.findTools(intent);
    
    // 3. Execute tool chain
    for (const tool of tools) {
      await this.executeTool(tool);
    }
  }
}
```

### Pattern 2: Automation Framework

Build automation workflows:

```typescript
interface Workflow {
  name: string;
  steps: Array<{
    tool: string;
    arguments: any;
    condition?: (prev: any) => boolean;
  }>;
}

class AutomationRunner {
  async runWorkflow(workflow: Workflow) {
    let previousResult = null;
    
    for (const step of workflow.steps) {
      if (step.condition && !step.condition(previousResult)) {
        continue;
      }
      
      previousResult = await this.callTool(
        step.tool,
        this.resolveArguments(step.arguments, previousResult)
      );
    }
  }
}
```

### Pattern 3: Tool Proxy with Caching

Implement caching for expensive operations:

```typescript
class CachedToolProxy {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private CACHE_TTL = 60000; // 1 minute
  
  async callTool(name: string, args: any) {
    const key = `${name}:${JSON.stringify(args)}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    
    const result = await chrome.runtime.sendMessage({
      type: 'CALL_TOOL',
      toolName: name,
      arguments: args
    });
    
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }
}
```

## Development Workflow

### Hot Reload Development

```bash
# Start development with hot reload
pnpm dev

# The extension will auto-reload on code changes
# Note: Background script changes require manual reload
```

### Building for Production

```bash
# Create optimized production build
pnpm build

# Output will be in .output/chrome-mv3/
```

### Testing

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Contributing

When contributing to this example:

1. **Follow Patterns** - Maintain consistency with existing code
2. **Add Documentation** - Document new features thoroughly
3. **Test Changes** - Verify with MCP-B extension
4. **Update Types** - Keep TypeScript definitions current

## Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference)
- [WXT Framework](https://wxt.dev)
- [MCP-B Repository](https://github.com/your-org/mcp-b)

## License

MIT