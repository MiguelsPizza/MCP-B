# MCP-B Personal AI Assistant Demo

A personal AI assistant website built with MCP-B (Model Context Protocol for Browsers) that demonstrates how AI can interact with your personal data and preferences through a login-protected interface.

## Features

- **Authentication System**: "Secure" login/logout functionality that controls access to personal AI tools
- **Personal State Management**: Track and update mood, projects, todos, thoughts, and preferences
- **AI-Powered Interactions**: Use the MCP-B browser extension to control your personal data via natural language
- **Dynamic Visual Updates**: Real-time UI updates that reflect your current state and preferences
- **Smart Notifications**: User-friendly notifications for all AI actions
- **Theme Customization**: AI can change your favorite color and update the page theme in real-time

## Available MCP Tools (when logged in)

When using the MCP-B browser extension, you can interact with your personal assistant using these tools:

- `updateMood` - Update your current mood and see it reflected on the page
- `addTodo` - Add new items to your personal todo list
- `recordThought` - Record your latest thoughts or insights
- `setCurrentProject` - Update what project you're currently working on
- `changeFavoriteColor` - Change your favorite color and update the page theme
- `getMyStatus` - Get a complete overview of your current personal status

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

- "Update my mood to excited"
- "Add 'finish the MCP demo' to my todo list"
- "Record this thought: MCP-B makes AI integration so easy!"
- "Set my current project to 'Building an AI-powered website'"
- "Change my favorite color to #ff6b6b"
- "What's my current status?"
- "Show me my todo list"
- "I'm feeling creative today"

## How It Works

This demo showcases how AI can manage personal data and preferences through the Model Context Protocol:

1. **Login Protection**: Personal AI tools are only available when logged in
2. **MCP Server Setup**: Upon login, an MCP server is created with personal tools
3. **Extension Detection**: The browser extension automatically detects available tools
4. **AI Interaction**: AI can call these tools based on user commands
5. **Real-time Updates**: The page responds with visual updates, notifications, and theme changes
6. **State Management**: Personal data persists during the session and resets on logout

## Technology Stack

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **MCP-B**: Browser-based Model Context Protocol implementation
- **Zod**: Schema validation for tool inputs
- **CSS**: Custom styling with dynamic theming and animations

## File Structure

```
src/
├── main.ts          # Main application entry point and UI setup
├── auth.ts          # Authentication logic, personal state, and MCP server setup
├── style.css        # Application styles with dynamic theme support
└── vite-env.d.ts    # Vite type definitions
```

## Key Features Demonstrated

- **Dynamic Tool Registration**: Tools are registered/unregistered based on login state
- **State-Driven UI**: Personal data changes are immediately reflected in the interface
- **Theme Integration**: AI can change visual appearance through the `changeFavoriteColor` tool
- **Rich Notifications**: Visual feedback for all AI actions
- **Data Persistence**: Personal state persists during the session
- **Secure Access**: Personal AI tools are only available when authenticated
