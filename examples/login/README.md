# MCP-B Login Demo

A standalone authentication demo built with MCP-B (Model Context Protocol for Browsers) demonstrating login/logout functionality that can be controlled by AI.

## Features

- **Manual Authentication**: Click login/logout buttons to test functionality
- **AI-Powered Controls**: Use the MCP-B browser extension to control authentication via natural language
- **Session Management**: Track login time, session duration, and user status
- **Real-time UI Updates**: Visual indicators for authentication state
- **Notification System**: User-friendly notifications for all authentication actions

## Available MCP Tools

When using the MCP-B browser extension, you can control this demo with these tools:

- `login` - Log in with an optional username
- `logout` - Log out of the application  
- `getAuthStatus` - Get current authentication status and session info
- `extendSession` - Extend the current session duration

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. Open your browser and navigate to the displayed URL (usually `http://localhost:5173`)

4. Install the MCP-B browser extension to interact with the demo via AI

## Example AI Commands

Try these natural language commands with the MCP-B extension:

- "Login as admin"
- "Check my authentication status"
- "Logout"
- "Extend my session by 60 minutes"
- "What's my current login status?"

## How It Works

This demo showcases how AI can interact with web applications through the Model Context Protocol:

1. The page exposes authentication tools via MCP
2. The browser extension detects available tools
3. AI can call these tools based on user commands
4. The page responds with visual updates and notifications

## Technology Stack

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **MCP-B**: Browser-based Model Context Protocol implementation
- **CSS**: Custom styling with dark/light mode support

## File Structure

```
src/
├── main.ts          # Main application entry point
├── auth.ts          # Authentication logic and MCP server setup
├── style.css        # Application styles
├── mcp.ts           # Additional MCP configurations
├── typescript.svg   # TypeScript logo
└── vite-env.d.ts    # Vite type definitions
```
