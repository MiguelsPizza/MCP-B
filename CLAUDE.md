# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Setup
- `pnpm install` - Install all dependencies across the monorepo
- `pnpm build:packages` - Build all workspace packages (required before running examples)
- `pnpm dev` - Start all development servers (extension, web demo, and packages in watch mode)

### Build and Quality
- `pnpm build` - Build all projects in the monorepo
- `pnpm typecheck` - Type-check all TypeScript files across the workspace
- `pnpm lint` - Run Biome linter with auto-fix
- `pnpm format` - Format code with Biome
- `pnpm check` - Run both linting and formatting checks
- `pnpm check-all` - Complete quality check (typecheck + biome ci)

### Testing
- `pnpm test` - Run all tests across the monorepo with Turbo
- `pnpm test:e2e` - Run end-to-end tests using Playwright
- For specific e2e tests: `cd e2e-tests && pnpm test:basic` or `pnpm test:mcp`

### Package Management
- `pnpm publish:packages` - Publish all workspace packages to npm
- `pnpm changeset` - Create changesets for version management
- `pnpm changeset:publish` - Build and publish packages using changesets

### Examples
- Run vanilla TypeScript example: `cd examples/vanilla-ts && npx vite`
- All examples require `pnpm build:packages` to be run first

## High-Level Architecture

This is MCP-B: a browser-native implementation of the Model Context Protocol (MCP) that allows websites to expose functionality as tools that AI agents can call directly.

### Core Concept
- **Traditional browser automation**: AI parses screenshots/DOM to "click" elements (slow, brittle)
- **MCP-B approach**: Websites expose structured tools that AI calls directly (fast, reliable)

### Key Components

#### 1. Transport Layer (`packages/transports/`)
The heart of MCP-B, providing browser-specific transport implementations:
- **TabServerTransport/TabClientTransport**: Uses `postMessage` for same-tab communication
- **ExtensionServerTransport/ExtensionClientTransport**: Uses Chrome runtime messaging for extension communication
- **NativeServerTransport/NativeClientTransport**: Bridges browser to local MCP clients

#### 2. Browser Extension (`extension/`)
Built with WXT framework, acts as MCP client:
- **Background service**: Manages connections to websites and native hosts
- **Sidepanel**: React-based UI with chat interface and tool inspector
- **Content scripts**: Inject MCP clients into web pages
- Uses Assistant UI (@assistant-ui/react) for chat interfaces

#### 3. Web Tools & Extension Tools (`packages/`)
- **@mcp-b/web-tools**: MCP tools for web APIs (like Prompt API)
- **@mcp-b/extension-tools**: Auto-generated MCP tools for Chrome Extension APIs
- **@mcp-b/mcp-react-hooks**: React hooks for MCP integration

#### 4. Demo Website (`web/`)
Full-stack demo showcasing MCP-B capabilities:
- **Frontend**: React with MCP server exposing todo management tools
- **Backend**: Cloudflare Workers with Hono.js and PostgreSQL
- **Real-time sync**: ElectricSQL for live data updates

#### 5. Native Host (`native-server/`)
Node.js server that bridges browser extension to local MCP clients:
- HTTP server on port 12306
- Proxies requests from desktop apps (Claude Desktop, Cursor) to browser

### Data Flow
1. Website registers MCP server with tools using `TabServerTransport`
2. Extension injects client that discovers available tools
3. User interacts via extension's chat or calls tools directly
4. Tools execute in website context with full authentication
5. Results flow back to AI with visual feedback in UI

### Key Architectural Decisions
- **Browser-first**: Leverages existing web security model and user authentication
- **Deterministic**: Tools return structured data, not visual parsing
- **Scoped**: Tools are page-specific and respect user sessions
- **Auditable**: All tool calls visible in extension UI

## Development Workflow

### Adding New Transport Types
Transport implementations live in `packages/transports/src/` and must implement the MCP transport interface.

### Creating New Tools
- For websites: Use `@mcp-b/transports` with `TabServerTransport`
- For extensions: Use `@mcp-b/extension-tools` or extend `BaseApiTools`
- Always use Zod schemas for input validation

### Extension Development
- Built with WXT (extension framework)
- Uses React with Tailwind CSS and Shadcn UI
- Background scripts manage MCP connections
- Sidepanel provides user interface

### Testing Strategy
- Unit tests with Vitest (extension)
- E2E tests with Playwright testing real extension functionality
- Manual testing with example applications

### Package Publishing
Uses changesets for version management:
1. Make changes
2. Run `pnpm changeset` to document changes
3. Run `pnpm changeset:version` to update versions
4. Run `pnpm changeset:publish` to publish

## Important Implementation Notes

### Monorepo Structure
- Uses pnpm workspaces with Turbo for task orchestration
- Packages have interdependencies requiring proper build order
- `build:packages` must run before examples work

### Extension Permissions
Extension requires broad permissions for Chrome API access. Tools are scoped appropriately in implementation.

### Security Model
- Respects browser same-origin policy
- Tools execute in website context using existing user authentication
- No data leaves browser except through explicit tool calls

### Tool Naming Convention
Recent migration to domain-prefixed tool names (e.g., `domain_com_toolName`) for multi-tab disambiguation.