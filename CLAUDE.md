# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Monorepo Development

- `pnpm dev` - Start all packages in development mode concurrently
- `pnpm build` - Build all packages using Turbo
- `pnpm typecheck` - Run TypeScript checks across all packages

### Package-Specific Commands

- **Web App**: `cd web && pnpm dev` (Vite development server)
- **Extension**: `cd extension && pnpm dev` (WXT development)

### Database Operations (Web Package)

- `cd web && pnpm db:generate` - Generate Drizzle migrations
- `cd web && pnpm db:migrate` - Run database migrations
- `cd web && pnpm db:push` - Push schema changes to database

### Package Publishing

- `pnpm build:packages` - Build all npm packages
- `pnpm version:patch` - Bump patch version for all packages
- `pnpm version:minor` - Bump minor version for all packages
- `pnpm version:major` - Bump major version for all packages
- `pnpm publish:dry` - Dry run to see what would be published
- `pnpm publish:packages` - Publish all packages to npm
- `pnpm publish:wizard` - Interactive publishing wizard

### Deployment

- **Web App**: `cd web && pnpm deploy` (Cloudflare Workers)
- **Extension**: `cd extension && pnpm build && pnpm zip`

## Project Architecture

**mcp-b** is a monorepo implementing a **Browser-based Model Context Protocol (MCP) system** that enables AI assistants to interact with browser applications through standardized MCP tools. It solves the critical gap where most white-collar work happens in browsers, yet MCP's standard solution bypasses browsers entirely.

### Core Innovation

MCP-B runs MCP servers **directly inside web pages**, allowing AI agents to:

- Use existing browser authentication (cookies, sessions, OAuth)
- Access structured data through MCP tools instead of screen scraping
- Orchestrate workflows across multiple web applications
- Maintain security within the browser's existing permission model

### Monorepo Structure

This is a **Turborepo** monorepo using **PNPM workspaces** with four main applications:

1. **Extension** (`/extension/`) - WXT-based browser extension with AI chat interface
2. **Web** (`/web/`) - Demo todo app with MCP server integration
3. **Packages** (`/packages/`) - Shared libraries and transports

### Core Technologies

- **Build System**: Turborepo for task orchestration and caching
- **Package Manager**: PNPM 10+ with workspaces
- **Runtime**: Node.js 22+ with ESM modules
- **Language**: TypeScript 5.8+ with strict type safety
- **Code Quality**: ESLint + Prettier with auto-formatting on save

### Extension Package (`/extension/`)

**Technology Stack:**

- **Framework**: WXT (Web Extension Toolkit) for cross-browser development
- **UI**: React 19 + TanStack Router
- **Styling**: TailwindCSS 4 + Radix UI components
- **AI Integration**: Assistant-UI React components with AI SDK

**Key Features:**

- Side panel chat interface for AI interactions
- Content scripts and background workers
- Page bridge communication via `pageBridge.ts`
- MCP client integration for browser-based AI tools

### Web Package (`/web/`)

**Technology Stack:**

- **Frontend**: Vite + React 19 + TanStack Query
- **Backend**: Hono framework on Cloudflare Workers
- **Database**: Drizzle ORM with PostgreSQL/Cloudflare D1
- **Real-time**: Electric SQL for data synchronization
- **AI**: AI SDK with OpenAI and Google providers

**Key Components:**

- Chat interface with AI assistant (`/src/Assistant.tsx`)
- Todo management with real-time sync (`/src/Todos.tsx`)
- MCP server implementation (`/src/services/MCP.ts`)
- Worker API routes (`/worker/routes/`)

### Shared Packages (`/packages/`)

**@mcp-b/transports:**

- Custom MCP transport implementations for browser environments
- `TabClientTransport` and `TabServerTransport` for in-page communication
- `ExtensionClientTransport` for extension-to-page communication
- Browser-specific message channel handling

**@mcp-b/mcp-react-hooks:**

- React hooks for MCP client integration
- Works with `@assistant-ui/react` for AI chat interfaces
- Automatic tool discovery and execution

**@mcp-b/extension-tools:**

- Chrome Extension API tools exposed via MCP
- AI-powered code generation helpers

### Local Server (`/local-server/`)

**WebSocket Bridge:**

- Enables MCP clients to connect to browser extensions
- Solves the limitation that browser extensions cannot host WebSocket servers
- Routes messages between multiple clients and extensions
- Includes STDIO-to-WebSocket proxy for MCP Inspector compatibility

### MCP Integration Architecture

**Server Side** (`/web/src/services/MCP.ts`):

- Exposes todo management tools to AI assistants
- Tools: `createTodo`, `updateTodo`, `deleteTodo`, `getTodos`, etc.
- Sort criteria management: `setSortCriteria`, `getSortCriteria`

**Client Side** (Extension + Web):

- MCP clients connect via custom browser transports
- AI assistant executes todo operations through standardized MCP tools
- Real-time synchronization with Electric SQL

### Database Schema

**Users Table:**

- UUID primary key, username (unique), timestamps

**Todos Table:**

- UUID primary key, text content, completion status, user_id (FK), timestamps

### Development Workflow

1. **Concurrent Development**: Use `pnpm dev` to run all packages simultaneously
2. **Type Safety**: Full-stack TypeScript with shared types across packages
3. **Hot Reload**: Vite for web, WXT for extension development
4. **Validation**: Zod schemas for API validation throughout

### API Structure

**Web Worker Routes** (`/web/worker/routes/`):

- `/api/todos` - CRUD operations with filtering/sorting
- `/api/users` - User management with auto-creation
- `/api/chat` - AI chat endpoints
- Electric SQL proxy routes for real-time sync

### Key Files

- `/turbo.json` - Turborepo configuration and task dependencies
- `/web/src/services/MCP.ts` - MCP server and tool definitions
- `/web/worker/db/schema.ts` - Database schema and types
- `/extension/entrypoints/pageBridge.ts` - Browser communication bridge
- `/extension/entrypoints/background/mcpHub.ts` - Central MCP hub for extension
- `/web/src/hooks/useAssistantMCP.tsx` - MCP client React integration
- `/local-server/src/bridge-server.ts` - WebSocket bridge implementation
- `/packages/transports/src/` - Browser transport implementations

## WebSocket Bridge Setup

### Starting the Bridge

```bash
cd local-server
pnpm bridge  # Starts on port 8021
```

### Connecting MCP Clients

**MCP Inspector:**

```bash
cd local-server
pnpm inspect:bridge
# Or manually:
npx @modelcontextprotocol/inspector tsx src/index.ts ws://localhost:8021
```

**Claude Desktop (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "browser-extension": {
      "command": "npx",
      "args": ["@mcp-b/websocket-bridge", "stdio"]
    }
  }
}
```

**Cursor (`.cursor/mcp.json`):**

```json
{
  "mcpServers": {
    "browser-extension": {
      "type": "websocket",
      "url": "ws://localhost:8021"
    }
  }
}
```

### Extension Configuration

In `extension/entrypoints/background/index.ts`, set:

```typescript
new McpHub('ws'); // Enable WebSocket mode
```

## Database Setup

### Development Database

1. Create `.dev.vars` file in `/web/` with:

   ```
   DATABASE_URL=your-postgres-connection-string
   ```

2. Run migrations:
   ```bash
   cd web
   pnpm db:migrate
   ```

### Production (Cloudflare D1)

- Database binding: `DB`
- Database name: `prod-d1-tutorial`
- Configure in `wrangler.jsonc`

## Extension Architecture

### Hub-and-Spoke Model

1. **Content Scripts**: Discover MCP servers on web pages
2. **Background Hub**: Aggregates tools from all tabs
3. **Tool Namespacing**: Prefixes tools with `tab{id}_` to avoid conflicts
4. **Domain Organization**: Groups tools by domain with deduplication
5. **Dynamic Updates**: Tools register/unregister as tabs open/close

### Key Features

- Automatic server discovery with exponential backoff
- Request/response pattern with unique IDs
- 30-second timeout for all operations
- Built-in `list_active_tabs` tool
- Visual indicators for active tabs

## Development Workflow

### Initial Setup

```bash
# Install dependencies
pnpm install

# Build everything
pnpm build

# Start development
pnpm dev
```

### Testing Extension with Bridge

1. Start bridge: `cd local-server && pnpm bridge`
2. Build extension: `cd extension && pnpm build`
3. Load `extension/.output/chrome-mv3` in Chrome
4. Connect with Inspector: `cd local-server && pnpm inspect:bridge`
5. Navigate to pages with MCP servers (e.g., the web demo app)

### Code Quality

- **Format on Save**: Configured in VSCode settings
- **Import Sorting**: Automatic organization (React → Third-party → Aliases → Relative)
- **Type Safety**: Strict TypeScript with no implicit any
- **Linting**: ESLint with React hooks rules

## Publishing Workflow

1. Run checks: `pnpm check-all`
2. Bump versions: `pnpm version:patch`
3. Dry run: `pnpm publish:dry`
4. Publish: `pnpm publish:packages`
5. Commit changes: `git add . && git commit -m "chore: bump versions"`

## Environment Requirements

- Node.js 22.12+
- PNPM 10+
- Chrome/Chromium for extension development
- PostgreSQL or Cloudflare account for database

## Security Considerations

- Extensions only access tabs user has open
- Web pages cannot directly access extension APIs
- All WebSocket connections remain on localhost
- Browser's existing permission model enforced
- Tool execution happens in page context

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
