# @mcp-b/global

[![npm version](https://img.shields.io/npm/v/@mcp-b/global?style=flat-square)](https://www.npmjs.com/package/@mcp-b/global)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Empower your website with AI capabilities using a single script tag!**

The `@mcp-b/global` package offers the easiest way to integrate MCP-B (Model Context Protocol for Browsers) into any website. It requires no build tools or complex configuration—just add a script tag to expose AI tools that leverage your site's existing functionality.

## ✨ Features

- 🚀 **Zero-Config Setup**: Works instantly in any modern browser.
- 🏷️ **Script Tag Integration**: Ideal for CDN deployment via unpkg or similar services.
- 🔧 **Global API Exposure**: Automatically creates `window.mcp` upon loading.
- 📦 **Multi-Format Support**: Compatible with ESM, CommonJS, and UMD.
- 🎯 **TypeScript-Ready**: Includes comprehensive type definitions.
- 🌐 **Framework-Agnostic**: Seamlessly integrates with vanilla JS, React, Vue, Angular, or any other framework.

## 🚀 Quick Start

### Option 1: Script Tag (Easiest)

Add this to your HTML for instant integration:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My AI-Enabled Site</title>
  </head>
  <body>
    <h1>Welcome</h1>

    <!-- Load MCP-B via CDN -->
    <script src="https://unpkg.com/@mcp-b/global@latest/dist/index.js"></script>

    <!-- Your custom script -->
    <script>
      // Wait for MCP to initialize
      function initMCP() {
        if (!window.mcp?.registerTool) {
          return setTimeout(initMCP, 100);
        }

        // Register a simple tool
        window.mcp.registerTool(
          "getPageDetails",
          {
            title: "Retrieve Page Details",
            description: "Fetches information about the current webpage",
          },
          async () => {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    title: document.title,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                  }),
                },
              ],
            };
          }
        );

        console.log("AI tools initialized!");
      }

      // Run on page load
      document.addEventListener("DOMContentLoaded", initMCP);
    </script>
  </body>
</html>
```

### Option 2: NPM Installation (For Advanced Control)

For projects using module bundlers or TypeScript:

```bash
npm install @mcp-b/global zod
```

```typescript
import { initializeGlobalMCP } from "@mcp-b/global";
import { z } from "zod";

// Initialize the global MCP instance
initializeGlobalMCP();

// Wait for readiness and register tools
function initMCP() {
  if (!window.mcp?.registerTool) {
    return setTimeout(initMCP, 100);
  }

  window.mcp.registerTool(
    "processMessage",
    {
      title: "Process User Message",
      description: "Handles and responds to a message",
      inputSchema: {
        message: z.string().describe("The message to process"),
      },
    },
    async ({ message }) => {
      return {
        content: [{ type: "text", text: `Processed: ${message}` }],
      };
    }
  );
}

initMCP();
```

## 🛠️ API Reference

### Global Interface

Loading the package attaches `mcp` to the window object:

```typescript
interface Window {
  mcp: McpServer; // MCP server instance for tool registration
}
```

### Key Methods

#### `window.mcp.registerTool(name, config, handler)`

Registers an AI-callable tool.

- **name**: Unique tool identifier (string).
- **config**: Object with `title` (string), `description` (string), and optional `inputSchema` (Zod schema for inputs).
- **handler**: Async function that executes the tool logic and returns `{ content: [{ type: 'text', text: string }] }`.

Example:

```typescript
import { z } from "zod";

window.mcp.registerTool(
  "echoInput",
  {
    title: "Echo Tool",
    description: "Echoes the provided input",
    inputSchema: { input: z.string() },
  },
  async ({ input }) => {
    return { content: [{ type: "text", text: `Echo: ${input}` }] };
  }
);
```

#### `initializeGlobalMCP()` (Optional)

Manually initializes the global MCP instance (automatic in script tag mode).

#### `cleanupGlobalMCP()` (Optional)

Cleans up the global instance, useful for testing or single-page apps.

### TypeScript Integration

Import types for full autocompletion:

```typescript
import "@mcp-b/global"; // Augments Window interface

window.mcp.registerTool(
  "mathOperation",
  {
    title: "Perform Math",
    description: "Basic arithmetic",
    inputSchema: { num1: z.number(), num2: z.number() },
  },
  async ({ num1, num2 }) => {
    return { content: [{ type: "text", text: `${num1 + num2}` }] };
  }
);
```

## 📖 Full Example: AI-Powered Todo App

This complete HTML file creates a todo list with AI tools for adding, viewing, and deleting items:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>AI Todo List</title>
    <style>
      body {
        font-family: sans-serif;
        max-width: 600px;
        margin: 2rem auto;
        padding: 1rem;
      }
      .todo {
        padding: 0.5rem;
        margin: 0.25rem 0;
        background: #f8f9fa;
        border-radius: 0.25rem;
      }
      .ai-feedback {
        background: #d4edda;
        color: #155724;
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
      }
    </style>
  </head>
  <body>
    <h1>AI-Enabled Todo List</h1>
    <div id="status">Initializing AI...</div>
    <div id="todos"></div>

    <!-- MCP-B Script -->
    <script src="https://unpkg.com/@mcp-b/global@latest/dist/index.js"></script>
    <!-- Zod for Schemas -->
    <script src="https://unpkg.com/zod@latest/lib/index.umd.js"></script>

    <script>
      const { z } = window.Zod;
      const todos = ["Demo Todo 1", "Demo Todo 2"];

      function showFeedback(message) {
        const feedback = document.createElement("div");
        feedback.className = "ai-feedback";
        feedback.textContent = `AI Action: ${message}`;
        document.body.insertBefore(feedback, document.getElementById("todos"));
        setTimeout(() => feedback.remove(), 3000);
      }

      function updateTodos() {
        document.getElementById("todos").innerHTML = todos
          .map((todo, index) => `<div class="todo">${index + 1}. ${todo}</div>`)
          .join("");
      }

      function initMCP() {
        if (!window.mcp?.registerTool) {
          return setTimeout(initMCP, 100);
        }

        window.mcp.registerTool(
          "addTodoItem",
          {
            title: "Add Todo",
            description: "Adds a new todo item",
            inputSchema: { text: z.string().describe("Todo text") },
          },
          async ({ text }) => {
            todos.push(text);
            showFeedback(`Added "${text}"`);
            updateTodos();
            return { content: [{ type: "text", text: `Added: ${text}` }] };
          }
        );

        window.mcp.registerTool(
          "listTodos",
          {
            title: "List Todos",
            description: "Retrieves all todos",
          },
          async () => {
            showFeedback("Listing todos");
            return { content: [{ type: "text", text: JSON.stringify(todos) }] };
          }
        );

        window.mcp.registerTool(
          "removeTodo",
          {
            title: "Remove Todo",
            description: "Deletes a todo by index (1-based)",
            inputSchema: { index: z.number().describe("Todo index") },
          },
          async ({ index }) => {
            const i = index - 1;
            if (i >= 0 && i < todos.length) {
              const removed = todos.splice(i, 1)[0];
              showFeedback(`Removed "${removed}"`);
              updateTodos();
              return {
                content: [{ type: "text", text: `Removed: ${removed}` }],
              };
            }
            return {
              content: [{ type: "text", text: `Invalid index: ${index}` }],
            };
          }
        );

        document.getElementById("status").textContent =
          "AI Ready! Tools available.";
        document.getElementById("status").style.background = "#d4edda";
        document.getElementById("status").style.color = "#155724";
        document.getElementById("status").style.padding = "0.5rem";
        document.getElementById("status").style.borderRadius = "0.25rem";
      }

      document.addEventListener("DOMContentLoaded", () => {
        updateTodos();
        initMCP();
      });
    </script>
  </body>
</html>
```

Save as `index.html` and open in a browser with the MCP-B extension installed.

## 🎯 Getting Started with the Extension

1. Install the [MCP-B Extension](https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa) from the Chrome Web Store.
2. Open your HTML file or site.
3. Use the extension's chat: Try "Add a todo: Buy milk" or "List all todos".

The AI interacts directly with your site's tools!

## 🌟 Use Cases

- **Quick Prototypes**: Add AI to static sites or landing pages.
- **Legacy Upgrades**: Enhance old HTML with AI without refactoring.
- **MVPs**: Rapidly build AI features for demos.
- **Learning MCP-B**: Experiment with concepts in a simple environment.

For production apps, consider [@mcp-b/transports](https://www.npmjs.com/package/@mcp-b/transports) for deeper integration.

## 📦 Distribution Formats

- **UMD**: `dist/index.umd.js` – For script tags/AMDs.
- **ESM**: `dist/index.js` – Modern modules.
- **CommonJS**: `dist/index.cjs` – Node.js compatibility.
- **Types**: `dist/index.d.ts` – TypeScript support.

Examples:

```html
<!-- UMD CDN -->
<script src="https://unpkg.com/@mcp-b/global@latest/dist/index.js"></script>
```

```javascript
// ESM
import { initializeGlobalMCP } from "@mcp-b/global";
```

## 🔧 Advanced Features

### Error Management

Handle failures gracefully:

```javascript
window.mcp.registerTool(
  "riskyTask",
  {
    title: "Risky Task",
    description: "May fail",
  },
  async () => {
    try {
      // Logic here
      return { content: [{ type: "text", text: "Success!" }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed: ${err.message}` }],
        isError: true,
      };
    }
  }
);
```

### User-Specific Tools

Register tools dynamically:

```javascript
function addUserTools(user) {
  if (user.isAdmin) {
    window.mcp.registerTool(
      "adminTool",
      {
        title: "Admin Tool",
        description: "Admin-only",
      },
      async () => {
        /* ... */
      }
    );
  }
}
```

## 🚨 Key Considerations

- **Browser-Only**: Designed exclusively for web environments.
- **Extension Needed**: Users require the MCP-B extension for AI interactions.
- **Security**: Tools inherit your site's permissions—expose only safe operations.
- **Readiness Check**: Always verify `window.mcp` before use.

## 🔗 Related Resources

- [@mcp-b/transports](https://www.npmjs.com/package/@mcp-b/transports): Advanced transport layer.
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk): Core MCP SDK.
- [MCP-B Extension](https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa): Browser extension for tool interaction.
- [Documentation](https://mcp-b.ai): Full guides and specs.

## 📄 License

MIT – See [LICENSE](https://github.com/MiguelsPizza/WebMCP/blob/main/LICENSE).

## 🤝 Contributing

Welcome! Check the [main repo](https://github.com/MiguelsPizza/WebMCP) for guidelines.

---

**Unlock AI for your site today—start with a script tag!** 🚀
