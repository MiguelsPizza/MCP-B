# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

- `pnpm dev` - Start development server with Vite
- `pnpm build` - Compile TypeScript and build the project for production
- `pnpm lint` - Run Biome to check for code quality issues
- `pnpm format` - Format code with Biome
- `pnpm check` - Run both formatting and linting with Biome
- `pnpm preview` - Build the project and preview the production build

### Database Operations

- `pnpm db:generate` - Generate Drizzle ORM migrations based on schema changes
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to the database

### Deployment

- `pnpm deploy` - Build the project and deploy with Cloudflare Wrangler

## Project Architecture

This project implements the Model Context Protocol (MCP) for browser windows, enabling communication between web pages and LLM clients within the browser.

### Core Components

1. **MCP Implementation**

   - The project implements the MCP protocol for browser windows, allowing a web page to expose contextual information, tools, and prompts through the `window.mcp` object.
   - `src/services/MCP.ts` defines the MCP server and tools for todo management.

2. **Frontend**

   - React-based UI with `@assistant-ui/react` components for chat interfaces
   - Uses Shadcn UI components for a modern interface
   - State management via React Query and ElectricSQL for real-time data

3. **Backend**

   - Cloudflare Workers-based backend using Hono.js framework
   - REST API for todos and users
   - PostgreSQL database with Drizzle ORM

4. **Data Flow**
   - MCP Server exposes tools for todo management
   - React components consume MCP client to interact with these tools
   - Real-time data synchronization using ElectricSQL

### Key Files and Directories

- `/src/services/MCP.ts` - MCP server and client setup
- `/src/hooks/useAssistantMCP.tsx` - Hook for connecting Assistant UI to MCP
- `/worker/db/schema.ts` - Database schema for users and todos
- `/worker/routes/` - API route handlers for users, todos, and chat
- `/src/components/assistant-ui/` - UI components for assistant functionality

## API Structure

1. **Todos API**

   - CRUD operations for todos
   - Filtering, sorting, and pagination
   - User-specific todo operations

2. **Users API**

   - User management (create, read, update, delete)
   - Auto-creation of users

3. **MCP Tools**
   - Create, update, delete todos
   - Query todos with filtering and sorting
   - Manage sort criteria

## Data Model

1. **Users**

   - UUID primary key
   - Username (unique)
   - Created/updated timestamps

2. **Todos**
   - UUID primary key
   - Text content
   - Completion status
   - User ID (foreign key)
   - Created/updated timestamps
