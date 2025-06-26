# @b-mcp/extension-tools

Chrome Extension API tools for Model Context Protocol (MCP) - provides MCP-compatible wrappers for browser extension APIs.

## Overview

This package provides a comprehensive set of tool classes that expose Chrome Extension APIs through the Model Context Protocol (MCP). Each API is wrapped in a dedicated class that handles permission checking, error handling, and tool registration.

Currently, **62 out of 74** Chrome Extension APIs have been implemented and are ready to use. See the [API Implementation Status](#api-implementation-status) section below for a complete list of available and pending APIs.

## Installation

```bash
npm install @b-mcp/extension-tools @modelcontextprotocol/sdk
# or
pnpm add @b-mcp/extension-tools @modelcontextprotocol/sdk
# or
yarn add @b-mcp/extension-tools @modelcontextprotocol/sdk
```

## API Implementation Status

### ✅ Available API Tools (62 APIs)

The following Chrome Extension APIs have been fully implemented and are ready to use:

- `AlarmsApiTools` - Set and manage alarms
- `AudioApiTools` - Audio device management
- `BookmarksApiTools` - Manage browser bookmarks
- `BrowsingDataApiTools` - Clear browsing data
- `CertificateProviderApiTools` - Provide certificates for TLS authentication
- `CommandsApiTools` - Manage keyboard shortcuts
- `ContentSettingsApiTools` - Manage content settings
- `ContextMenusApiTools` - Create context menu items
- `CookiesApiTools` - Manage browser cookies
- `DebuggerApiTools` - Debug network and JavaScript
- `DeclarativeContentApiTools` - Take actions based on content
- `DeclarativeNetRequestApiTools` - Modify network requests
- `DesktopCaptureApiTools` - Capture desktop content
- `DevtoolsInspectedWindowApiTools` - Interact with inspected window
- `DevtoolsNetworkApiTools` - Retrieve network information
- `DevtoolsPanelsApiTools` - Create DevTools panels
- `DocumentScanApiTools` - Scan documents
- `DomApiTools` - Access DOM from extensions
- `DownloadsApiTools` - Control file downloads
- `EnterpriseDeviceAttributesApiTools` - Access enterprise device attributes
- `EnterpriseHardwarePlatformApiTools` - Access enterprise hardware info
- `EnterpriseNetworkingAttributesApiTools` - Access enterprise network attributes
- `EnterprisePlatformKeysApiTools` - Enterprise platform keys
- `ExtensionApiTools` - Extension utilities
- `FileBrowserHandlerApiTools` - Handle file browser events
- `FileSystemProviderApiTools` - Provide file systems
- `FontSettingsApiTools` - Manage font settings
- `GcmApiTools` - Google Cloud Messaging
- `HistoryApiTools` - Search and manage browsing history
- `I18nApiTools` - Internationalization utilities
- `IdentityApiTools` - OAuth2 authentication
- `IdleApiTools` - Detect idle state
- `InputImeApiTools` - Input method editor
- `InstanceIDApiTools` - Instance ID operations
- `LoginStateApiTools` - Read login state
- `ManagementApiTools` - Manage extensions
- `NotificationsApiTools` - Create system notifications
- `OffscreenApiTools` - Manage offscreen documents
- `OmniboxApiTools` - Customize address bar
- `PageCaptureApiTools` - Save pages as MHTML
- `PermissionsApiTools` - Request optional permissions
- `PlatformKeysApiTools` - Platform-specific keys
- `PowerApiTools` - Power management
- `PrintingApiTools` - Print documents
- `PrintingMetricsApiTools` - Printing metrics
- `ProxyApiTools` - Manage proxy settings
- `ReadingListApiTools` - Access reading list
- `RuntimeApiTools` - Access extension runtime information
- `ScriptingApiTools` - Execute scripts and inject CSS
- `SearchApiTools` - Search via default provider
- `SessionsApiTools` - Query and restore browser sessions
- `SidePanelApiTools` - Control side panel
- `StorageApiTools` - Access extension storage (local, sync, session)
- `SystemCpuApiTools` - Query CPU information
- `SystemLogApiTools` - Add system log entries
- `SystemMemoryApiTools` - Get memory information
- `SystemStorageApiTools` - Query storage devices
- `TabCaptureApiTools` - Capture tab media streams
- `TabGroupsApiTools` - Manage tab groups
- `TabsApiTools` - Create, update, query, and manage browser tabs
- `TopSitesApiTools` - Access top sites
- `TtsApiTools` - Text-to-speech functionality
- `TtsEngineApiTools` - Implement TTS engine
- `UserScriptsApiTools` - Execute user scripts
- `VpnProviderApiTools` - Implement VPN client
- `WallpaperApiTools` - Set wallpaper
- `WebAuthenticationProxyApiTools` - Web authentication proxy
- `WebNavigationApiTools` - Monitor web navigation
- `WebRequestApiTools` - Intercept and modify requests
- `WindowsApiTools` - Control browser windows

### 🚧 APIs Under Development (12 APIs)

The following Chrome Extension APIs are not yet implemented or need additional work:

- `AccessibilityFeaturesApiTools` - Manage accessibility features
- `ActionApiTools` - Control extension's action button
- `DevtoolsPerformanceApiTools` - Access performance data
- `DevtoolsRecorderApiTools` - DevTools recorder panel
- `DnsApiTools` - DNS resolution
- `EventsApiTools` - Common event handling
- `ExtensionTypesApiTools` - Extension type definitions
- `PrinterProviderApiTools` - Provide printers
- `PrivacyApiTools` - Control privacy features
- `ProcessesApiTools` - Interact with browser processes
- `SystemDisplayApiTools` - Query display information
- `TypesApiTools` - Chrome type definitions

## Usage

### Server Setup

Create an MCP server in your Chrome extension's background script:

```typescript
import { BookmarksApiTools, StorageApiTools, TabsApiTools } from '@b-mcp/extension-tools';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebsocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';

// Create MCP server
const server = new McpServer({
  name: 'chrome-extension-server',
  version: '1.0.0',
});

// Register individual API tools with specific methods enabled
const tabsTools = new TabsApiTools(server, {
  listActiveTabs: true,
  createTab: true,
  updateTab: true,
  closeTabs: true,
  getAllTabs: true,
  navigateHistory: true,
  reloadTab: true,
});
tabsTools.register();

const bookmarksTools = new BookmarksApiTools(server, {
  getBookmarks: true,
  createBookmark: true,
  updateBookmark: true,
  removeBookmark: true,
});
bookmarksTools.register();

const storageTools = new StorageApiTools(server, {
  getStorage: true,
  setStorage: true,
  removeStorage: true,
  clearStorage: true,
});
storageTools.register();

// Connect to transport
const transport = new WebsocketServerTransport({
  port: 3000,
});
await server.connect(transport);
```

### Client Usage

Connect to the server and call the registered tools:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebsocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';

// Create and connect client
const client = new Client({
  name: 'my-mcp-client',
  version: '1.0.0',
});

const transport = new WebsocketClientTransport(new URL('ws://localhost:3000'));
await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call extension tools
// Create a new tab
const createResult = await client.callTool({
  name: 'create_tab',
  arguments: {
    url: 'https://example.com',
    active: true,
    pinned: false,
  },
});

// Get all tabs
const tabsResult = await client.callTool({
  name: 'get_all_tabs',
  arguments: {
    currentWindow: true,
  },
});

// Search bookmarks
const bookmarksResult = await client.callTool({
  name: 'get_bookmarks',
  arguments: {
    query: 'example',
  },
});

// Store data
const storageResult = await client.callTool({
  name: 'set_storage',
  arguments: {
    area: 'local',
    items: {
      key1: 'value1',
      key2: { nested: 'object' },
    },
  },
});

// Execute script in active tab
const scriptResult = await client.callTool({
  name: 'execute_script',
  arguments: {
    target: { tabId: undefined }, // defaults to active tab
    func: '() => document.title',
  },
});
```

## Tool Configuration

Each API tool class accepts configuration options to enable specific methods:

```typescript
// TabsApiTools options
interface TabsOptions {
  listActiveTabs?: boolean;
  createTab?: boolean;
  updateTab?: boolean;
  closeTabs?: boolean;
  getAllTabs?: boolean;
  navigateHistory?: boolean;
  reloadTab?: boolean;
  captureVisibleTab?: boolean;
  detectLanguage?: boolean;
  discardTab?: boolean;
  duplicateTab?: boolean;
  getTab?: boolean;
  getZoom?: boolean;
  setZoom?: boolean;
  groupTabs?: boolean;
  ungroupTabs?: boolean;
  highlightTabs?: boolean;
  moveTabs?: boolean;
  sendMessage?: boolean;
}

// Similar options exist for other API tools
```

## Permission Requirements

Each Chrome API requires specific permissions in your extension's manifest.json. Here are some common permissions:

```json
{
  "manifest_version": 3,
  "permissions": [
    "activeTab",
    "alarms",
    "audio",
    "bookmarks",
    "browsingData",
    "certificateProvider",
    "contentSettings",
    "contextMenus",
    "cookies",
    "debugger",
    "declarativeContent",
    "declarativeNetRequest",
    "desktopCapture",
    "downloads",
    "fontSettings",
    "gcm",
    "history",
    "identity",
    "idle",
    "management",
    "notifications",
    "offscreen",
    "pageCapture",
    "permissions",
    "platformKeys",
    "power",
    "printing",
    "printingMetrics",
    "proxy",
    "readingList",
    "scripting",
    "search",
    "sessions",
    "sidePanel",
    "storage",
    "system.cpu",
    "system.memory",
    "system.storage",
    "tabCapture",
    "tabGroups",
    "tabs",
    "topSites",
    "tts",
    "ttsEngine",
    "unlimitedStorage",
    "vpnProvider",
    "wallpaper",
    "webAuthenticationProxy",
    "webNavigation",
    "webRequest"
  ],
  "host_permissions": [
    "<all_urls>" // Required for scripting API and some other APIs
  ],
  "optional_permissions": [
    // Add any permissions you want to request at runtime
  ]
}
```

**Note:** Not all APIs require permissions. Some APIs like `i18n`, `runtime`, and `extension` are available without explicit permissions. Enterprise APIs require the extension to be force-installed via enterprise policy.

## Tool Examples

### Tab Management

```typescript
// List tabs grouped by domain
const result = await client.callTool({
  name: 'list_active_tabs',
  arguments: {},
});

// Update the active tab's URL
const updateResult = await client.callTool({
  name: 'update_tab',
  arguments: {
    url: 'https://new-url.com',
    active: true,
  },
});

// Group multiple tabs
const groupResult = await client.callTool({
  name: 'group_tabs',
  arguments: {
    tabIds: [1, 2, 3],
  },
});
```

### Storage Operations

```typescript
// Get storage data
const data = await client.callTool({
  name: 'get_storage',
  arguments: {
    area: 'local',
    keys: ['setting1', 'setting2'],
  },
});

// Clear all storage
const clearResult = await client.callTool({
  name: 'clear_storage',
  arguments: {
    area: 'local',
  },
});
```

### History Search

```typescript
// Search browsing history
const historyResult = await client.callTool({
  name: 'search_history',
  arguments: {
    text: 'github',
    maxResults: 20,
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last week
  },
});
```

## Architecture

Each API tool class extends `BaseApiTools` which provides:

- **Automatic permission checking** - Verifies API availability before registering tools
- **Consistent error handling** - Standardized error responses
- **Tool registration helpers** - Simplified tool registration process
- **Response formatting** - Consistent response format across all tools

```typescript
export abstract class BaseApiTools {
  protected abstract apiName: string;

  abstract checkAvailability(): ApiAvailability;
  abstract registerTools(): void;

  register(): void {
    const availability = this.checkAvailability();
    if (availability.available) {
      console.log(`Registering ${this.apiName} API tools...`);
      this.registerTools();
    } else {
      console.warn(`${this.apiName} API not available:`, availability.message);
    }
  }
}
```

## Error Handling

All tools include comprehensive error handling and return structured error responses:

```typescript
try {
  const result = await client.callTool({
    name: 'create_tab',
    arguments: { url: 'invalid-url' },
  });
} catch (error) {
  // Error response will include:
  // - error: true
  // - content: [{ type: 'text', text: 'Error message' }]
}
```

## Complete Example

Here's a complete example of setting up a Chrome extension with MCP tools:

```typescript
// background.js - Extension background script
import {
  BookmarksApiTools,
  HistoryApiTools,
  ScriptingApiTools,
  StorageApiTools,
  TabsApiTools,
} from '@b-mcp/extension-tools';
import { ExtensionServerTransport } from '@b-mcp/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

async function setupMcpServer() {
  const server = new McpServer({
    name: 'my-chrome-extension',
    version: '1.0.0',
  });

  // Register multiple API tools
  const apis = [
    new TabsApiTools(server, {
      listActiveTabs: true,
      createTab: true,
      updateTab: true,
      closeTabs: true,
      getAllTabs: true,
    }),
    new BookmarksApiTools(server, {
      getBookmarks: true,
      createBookmark: true,
    }),
    new StorageApiTools(server, {
      getStorage: true,
      setStorage: true,
    }),
    new HistoryApiTools(server, {
      searchHistory: true,
    }),
    new ScriptingApiTools(server, {
      executeScript: true,
      insertCSS: true,
    }),
  ];

  // Register all tools
  apis.forEach((api) => api.register());

  // Connect transport
  const transport = new ExtensionServerTransport();
  await server.connect(transport);

  console.log('MCP server ready with Chrome extension tools');
}

setupMcpServer();
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions for all APIs and tool parameters.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## See Also

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)
- [B-MCP Project](https://github.com/alxnahas/B-MCP)
