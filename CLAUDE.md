# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Monorepo Development

- `pnpm dev` - Start all packages in development mode concurrently
- `pnpm build` - Build all packages using Turbo
- `pnpm lint` - Run ESLint across all packages with auto-fix
- `pnpm lint:check` - Check linting without fixing
- `pnpm typecheck` - Run TypeScript checks across all packages
- `pnpm check-all` - Run typecheck, lint check, and format check
- `pnpm test` - Run tests across all packages
- `pnpm clean` - Clean all build artifacts and node_modules

### Package-Specific Commands

- **Web App**: `cd web && pnpm dev` (Vite development server)
- **Extension**: `cd extension && pnpm dev` (WXT development)
- **Extension Firefox**: `cd extension && pnpm dev:firefox`

### Database Operations (Web Package)

- `cd web && pnpm db:generate` - Generate Drizzle migrations
- `cd web && pnpm db:migrate` - Run database migrations
- `cd web && pnpm db:push` - Push schema changes to database

### Deployment

- **Web App**: `cd web && pnpm deploy` (Cloudflare Workers)
- **Extension**: `cd extension && pnpm build && pnpm zip`

## Project Architecture

**mcp-b** is a monorepo implementing a **Browser-based Model Context Protocol (MCP) system** that enables AI assistants to interact with browser applications and manage todos through standardized MCP tools.

### Monorepo Structure

This is a **Turborepo** monorepo using **PNPM workspaces** with three main applications:

1. **Extension** (`/extension/`) - WXT-based browser extension
2. **Web** (`/web/`) - Full-stack Vite + Cloudflare Workers app
3. **Packages** (`/packages/`) - Shared libraries

### Core Technologies

- **Build System**: Turborepo for task orchestration and caching
- **Package Manager**: PNPM with workspaces
- **Runtime**: Node.js 22+ with ESM modules
- **Language**: TypeScript 5.8+ with strict type safety

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
- `TabClientTransport` and `TabServerTransport` for browser communication

**@mcp-b/mcp-react-hooks:**

- React hooks for MCP client integration
- Works with `@assistant-ui/react` for AI chat interfaces

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
- `/web/src/hooks/useAssistantMCP.tsx` - MCP client React integration
