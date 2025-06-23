# WebSocket Bridge Architecture

This document provides a comprehensive overview of the WebSocket bridge architecture that enables MCP clients to connect to browser extensions.

## Table of Contents

1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Detailed Component Flow](#detailed-component-flow)
4. [Message Flow Sequence](#message-flow-sequence)
5. [Setup Process](#setup-process)
6. [Key Components](#key-components)
7. [Connection Flow Summary](#connection-flow-summary)

## Overview

The WebSocket bridge system solves a key limitation: browser extensions cannot host WebSocket servers. Instead, we use a bridge pattern where:

- A Node.js server hosts the actual WebSocket server
- The browser extension connects to it as a client
- The bridge routes messages between MCP clients and the extension
- The extension appears as a standard MCP server to clients

## High-Level Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Development       │     │     Protocol        │     │      Bridge         │
│      Tools          │     │   Translation       │     │      Layer          │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│                     │     │                     │     │                     │
│  MCP Inspector      │────▶│  STDIO ↔ WebSocket  │────▶│  WebSocket Bridge   │
│  (STDIO only)       │     │      Proxy          │     │   localhost:8021    │
│                     │     │                     │     │                     │
├─────────────────────┤     │                     │     │  • Multiple clients │
│                     │     │                     │     │  • Connection IDs   │
│  Claude Desktop     │─────┼─────────────────────┼────▶│  • Message routing  │
│  (WebSocket native) │     │                     │     │                     │
│                     │     │                     │     │                     │
├─────────────────────┤     │                     │     │                     │
│                     │     │                     │     │                     │
│  Cursor IDE         │─────┼─────────────────────┼────▶│                     │
│  (WebSocket native) │     │                     │     │                     │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └──────────┬──────────┘
                                                                    │
                                                                    │ WebSocket +
                                                                    │ connectionId
                                                                    ▼
                                                         ┌─────────────────────┐
                                                         │  Browser Extension  │
                                                         │     (MCP Hub)       │
                                                         ├─────────────────────┤
                                                         │ • Acts as MCP Server│
                                                         │ • Manages tab tools │
                                                         │ • Tool namespacing  │
                                                         │ • Routes tool calls │
                                                         └──────────┬──────────┘
                                                                    │
                                                                    │ Chrome Extension
                                                                    │ Port Messages
                                                                    ▼
                                                         ┌─────────────────────┐
                                                         │   Browser Tabs      │
                                                         ├─────────────────────┤
                                                         │ • Register tools    │
                                                         │ • Execute calls     │
                                                         │ • Return results    │
                                                         └─────────────────────┘
```

## Detailed Component Flow

### Components and Their Connections

```
MCP Inspector ──STDIO──▶ Proxy (index.ts) ──WebSocket──▶ Bridge (:8021)
                                                              │
                                                              │ WebSocket +
                                                              │ connectionId
                                                              ▼
                                                        Extension Hub
                                                              │
                                                              │ Port Messages
                                                              ▼
                                                    ┌────────┴────────┐
                                                    │                 │
                                                Tab 1            Tab 2 ... Tab N
                                              (Tools)          (Tools)   (Tools)
```

## Message Flow Sequence

### 1. Connection Setup

```
Inspector → Proxy: STDIO connection
Proxy → Bridge: WebSocket connect to ws://localhost:8021
Extension → Bridge: WebSocket connect to ws://localhost:8021?type=extension
Bridge: Assigns connectionId to Inspector session
```

### 2. MCP Initialize

```
Inspector → Proxy: {"method": "initialize", "params": {...}}
Proxy → Bridge: Forward message via WebSocket
Bridge → Extension: Message + connectionId
Extension: Process initialize request
Extension → Bridge: Response + connectionId
Bridge → Proxy: Route response to correct client
Proxy → Inspector: Forward response via STDIO
```

### 3. Tool Discovery (tools/list)

```
Inspector → ... → Extension: tools/list request
Extension → Tabs: Query all registered tools
Tabs → Extension: Return tool definitions
Extension: Prefix tools (e.g., tab123_createTodo)
Extension → ... → Inspector: Namespaced tool list
```

### 4. Tool Execution

```
Inspector → ... → Extension: Call tab123_createTodo
Extension: Extract tab ID from tool name
Extension → Tab 123: Execute createTodo
Tab 123 → Extension: Return result
Extension → ... → Inspector: Tool execution result
```

## Setup Process

### Step 1: Start the Bridge Server

```bash
cd local-server
pnpm bridge
# Bridge starts on port 8021
```

### Step 2: Configure the Extension

In `extension/entrypoints/background/index.ts`:

```typescript
new McpHub('ws'); // Enable WebSocket mode
```

Build and load:

```bash
cd extension
pnpm build
# Load extension/.output/chrome-mv3 in Chrome
```

### Step 3: Connect MCP Inspector

```bash
cd local-server

# Option A: Use the all-in-one command
pnpm inspect:bridge

# Option B: Manual connection
npx @modelcontextprotocol/inspector tsx src/index.ts ws://localhost:8021
```

## Key Components

### 1. WebSocket Bridge (`bridge-server.ts`)

- Hosts WebSocket server on port 8021
- Accepts connections from both clients and extensions
- Routes messages using connection IDs
- Handles multiple simultaneous clients

### 2. STDIO-to-WebSocket Proxy (`index.ts`)

- Provides STDIO interface for MCP Inspector
- Connects as WebSocket client to the bridge
- Bidirectional message translation
- Transparent protocol conversion

### 3. Extension MCP Hub (`mcpHub.ts`)

- Connects to bridge as a special client (`?type=extension`)
- Acts as an MCP server despite being a client
- Manages tools from all browser tabs
- Namespaces tools to prevent conflicts

### 4. Browser Tabs

- Register MCP tools via content scripts
- Execute tool calls in their context
- Return results through the extension

## Connection Flow Summary

```
1. MCP Inspector connects via STDIO to the proxy
2. Proxy connects via WebSocket to the bridge
3. Extension connects via WebSocket to the bridge (identifies as extension)
4. Bridge assigns connection IDs and routes messages
5. Extension processes MCP requests and returns responses
6. Responses flow back through the same path
```

### For WebSocket-native clients (Claude, Cursor):

- Skip the proxy step
- Connect directly to ws://localhost:8021
- Same message routing through the bridge

## Benefits

- **Compatibility**: Works with STDIO-only clients like MCP Inspector
- **Flexibility**: Supports multiple simultaneous client connections
- **Security**: All connections remain on localhost
- **Transparency**: Extension appears as a standard MCP server
- **Scalability**: Bridge can handle many clients and extensions
