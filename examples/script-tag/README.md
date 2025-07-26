# 🤖 MCP-B Script Tag Demo

**Add AI superpowers to any website with just one script tag!**

This example demonstrates the absolute simplest way to make any website AI-controllable using MCP-B. No build tools, no complex setup - just HTML and JavaScript.

## ✨ What You'll See

- **🎯 4 Working AI Tools**: Add todos, get todos, delete todos, and calculate math
- **👀 Big Visual Feedback**: Huge green popups when AI takes action
- **🧠 Zero Build Tools**: No npm install, no bundlers, just HTML + one script tag
- **⚡ Instant Results**: AI can control your page immediately
- **📚 Learning Example**: Perfect for understanding MCP-B concepts

## 🚀 Quick Start

### Method 1: Run the Development Server

```bash
cd examples/script-tag
pnpm install --ignore-workspace  # Just for the dev server
pnpm dev                          # Opens at http://localhost:5173
```

### Method 2: Open the HTML File Directly

You can also just open `src/index.html` directly in your browser - it works without any server!

### Then Try It Out

1. **Install the [MCP-B Extension](https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa)**
2. **Refresh the page** and see "✅ MCP Ready! 4 AI tools active"
3. **Open the extension** and try chatting:
   - _"Add a todo: Buy groceries"_
   - _"Show all my todos"_
   - _"Calculate 15 times 23"_
4. **Watch the big green popups!** 🎭

## 🎯 The Magic Script Tag

This entire working demo uses **just one script tag**:

```html
<script src="https://unpkg.com/@mcp-b/global@latest"></script>
```

That's it! The `@mcp-b/global` package:

- ✅ Auto-creates `window.mcp` when the page loads
- ✅ Handles all MCP transport and connection logic
- ✅ Works immediately in any browser
- ✅ No build process required
- ✅ Full TypeScript support included

## 🛠️ Creating AI Tools

Super simple - just call `window.mcp.registerTool()`:

```javascript
// Access Zod from global (if loaded via script tag)
const { z } = window.Zod;

// Wait for MCP to load, then register tools
function registerMCPTools() {
  const mcp = window.mcp;
  if (!mcp?.registerTool) {
    setTimeout(registerMCPTools, 100); // Retry until ready
    return;
  }

  // Register a tool AI can call
  mcp.registerTool(
    "addTodo",
    {
      title: "Add Todo",
      description: "Add a new todo item",
      inputSchema: {
        text: z.string().describe("Todo text to add"),
      },
    },
    async ({ text }) => {
      // Your logic here
      const result = addTodo(text);

      // Show visual feedback
      showBigPopup("Adding Todo", `"${text}"`);

      // Return result to AI
      return { content: [{ type: "text", text: `✅ Added: "${result}"` }] };
    }
  );
}

// Start trying to register when page loads
document.addEventListener("DOMContentLoaded", registerMCPTools);
```

## 🎮 Try These Commands

Once the extension is installed, try chatting:

### 📝 Todo Management

- _"Add a todo: Buy groceries"_
- _"Show all my todos"_
- _"Delete todo 2"_

### 🧮 Calculator

- _"What's 15 times 23?"_
- _"Calculate 100 divided by 4"_

**Watch for the big green popups!** They show exactly what AI is doing.

## 🏗️ Complete Implementation

This demo has 4 tools:

| Tool         | What It Does            | Example Command           |
| ------------ | ----------------------- | ------------------------- |
| `addTodo`    | Adds new todo items     | _"Add a todo: Call mom"_  |
| `getTodos`   | Lists all current todos | _"What todos do I have?"_ |
| `deleteTodo` | Removes todos by number | _"Delete todo 2"_         |
| `calculate`  | Performs math           | _"What's 25 _ 4?"\*       |

## 🌟 When to Use This

**Perfect for:**

- 🏃‍♂️ **Rapid prototyping** - Get AI tools in minutes
- 🎯 **Landing pages** - Add interactivity without complexity
- 🔄 **Legacy sites** - Retrofit existing HTML with AI capabilities
- 📚 **Learning MCP-B** - Understand concepts quickly

**For bigger projects, see:** [TypeScript example](../vanilla-ts/) with full type safety and build tools.

## 💡 Key Insights

- **Visual Feedback**: Big popups make it obvious when AI acts
- **Simple State**: Just arrays and basic functions work great
- **Error Handling**: Try/catch blocks return useful error messages
- **Human + AI**: Both humans and AI can use the same functions

**The breakthrough**: Instead of teaching AI to click buttons, expose direct function calls that AI can use perfectly every time! 🧠✨

## 📦 What's Inside

### File Structure

```
examples/script-tag/
├── src/
│   ├── index.html      # Main HTML page with embedded script tag
│   └── main.ts         # TypeScript with tool registration logic
├── package.json        # Dev dependencies (just for Vite dev server)
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration for development
```

### Key Files

- **`src/index.html`** - Complete working example that runs standalone
- **`src/main.ts`** - Shows how to register AI tools and handle user interactions
- The script tag loads `@mcp-b/global@latest` which provides `window.mcp`

## 🔧 How It Works

1. **Script tag loads** → `@mcp-b/global` creates `window.mcp`
2. **Page loads** → JavaScript registers 4 AI tools
3. **Extension detects** → Tools appear in MCP-B extension
4. **AI calls tools** → Functions execute with visual feedback
5. **Users see results** → Big green popups show what happened

## 🚀 Adapt for Your Website

Want to add AI to your existing website? Copy this pattern:

```html
<!-- Add to your existing HTML -->
<script src="https://unpkg.com/@mcp-b/global@latest"></script>

<script>
  function setupAI() {
    if (!window.mcp?.registerTool) {
      setTimeout(setupAI, 100);
      return;
    }

    // Replace with your actual functions
    window.mcp.registerTool(
      "yourAction",
      {
        title: "Your Action",
        description: "What your function does",
        inputSchema: {
          param: z.string().describe("Parameter description"),
        },
      },
      async ({ param }) => {
        // Your existing function call
        const result = yourExistingFunction(param);

        // Show feedback
        alert(`AI called: ${param}`);

        // Return result
        return { content: [{ type: "text", text: `Result: ${result}` }] };
      }
    );
  }

  document.addEventListener("DOMContentLoaded", setupAI);
</script>
```

## 🌟 Next Steps

- **For TypeScript projects**: Use [@mcp-b/transports](https://www.npmjs.com/package/@mcp-b/transports) directly
- **For complex apps**: See the [vanilla-ts example](../vanilla-ts/) with full build tools
- **For production**: Consider tool authentication and input validation

**The breakthrough**: Instead of teaching AI to click buttons, expose direct function calls that AI can use perfectly every time! 🧠✨
