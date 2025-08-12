# WebMCP Userscripts - AI Assistant Documentation Guide

## 📚 Documentation Structure for AI Assistants

This directory contains documentation and examples for developing WebMCP userscripts that inject MCP-B servers into websites. As an AI assistant, use the following guides based on your task:

### Documentation Files

#### 1. **WEBMCP_USERSCRIPT_GUIDE.md** (Primary Reference)
**Purpose:** Comprehensive development guide for creating, testing, and debugging userscripts
**When to use:**
- When asked to create a new userscript for any website
- When debugging existing userscripts
- When you need detailed workflow phases and best practices
- For understanding the complete WebMCP ecosystem

**Contents:**
- Complete development workflow (6 phases)
- Tool discovery and usage patterns
- Selector strategies and React compatibility
- Testing and debugging patterns
- Common issues and solutions
- Code examples and templates

#### 2. **AI_AUTOMATION_PROMPT.md** (Quick Start Template)
**Purpose:** Concise, action-oriented prompt template for rapid userscript development
**When to use:**
- When you need to quickly create a userscript without detailed explanations
- For autonomous development without user interaction
- As a copy-paste template for immediate action

**Contents:**
- Step-by-step autonomous workflow
- Time-boxed development phases
- Success criteria checklist
- Minimal explanations, maximum action

#### 3. **** (Real-World Example)
**Purpose:** Actual implementation example showing the complete workflow for ChatGPT
**When to use:**
- As a reference when creating similar React-based userscripts
- To understand common pitfalls and solutions
- For seeing the complete test sequence

**Contents:**
- Real reconnaissance results
- Actual code that works
- Issues encountered and solutions
- Complete test sequence with real tab IDs

## 🤖 AI Assistant Quick Reference

### Task-Based Guide Selection

| User Request | Primary Guide | Secondary Reference |
|-------------|--------------|-------------------|
| "Create a userscript for [website]" | AI_AUTOMATION_PROMPT.md | WEBMCP_USERSCRIPT_GUIDE.md |
| "Debug why tools aren't appearing" | WEBMCP_USERSCRIPT_GUIDE.md |  |
| "Find selectors for [website]" | WEBMCP_USERSCRIPT_GUIDE.md (Phase 1) | - |
| "Make it work with React" | WEBMCP_USERSCRIPT_GUIDE.md (React section) |  |
| "Just inject and test quickly" | AI_AUTOMATION_PROMPT.md | - |

### Essential Commands for AI

```bash
# Navigate to userscripts directory
cd /path/to/WebMCP/webmcp-userscripts

# Create new script directory
mkdir -p scripts/[sitename]/src
cd scripts/[sitename]

# Build a script
pnpm install
pnpm run build

# Output location (for injection)
# dist/[sitename].user.js
```

### Tool Usage Pattern

1. **Reconnaissance** (Playwright MCP):
   - `mcp_playwright_browser_navigate`
   - `mcp_playwright_browser_snapshot`
   - `mcp_playwright_browser_evaluate`

2. **Development** (File tools):
   - Create files in `scripts/[sitename]/src/`
   - Use templates from documentation

3. **Testing** (WebMCP Extension):
   - `mcp_mcp-b_call_extension_tool(toolName: "extension_tool_list_active_tabs")`
   - `mcp_mcp-b_extension_tool_execute_user_script`
   - `mcp_mcp-b_list_website_tools`
   - `mcp_mcp-b_call_website_tool`

## 📁 Project Structure

```
webmcp-userscripts/
├── README.md                        # This file - AI usage guide
├── WEBMCP_USERSCRIPT_GUIDE.md      # Comprehensive development guide
├── AI_AUTOMATION_PROMPT.md         # Quick autonomous template
├──               # Real-world example
├── scripts/                        # Individual userscripts
│   ├── gmail/                     # Gmail MCP-B script
│   ├── google/                    # Google search script
│   └── chatgpt/                   # ChatGPT script (see example)
├── packages/                       # Shared code
├── templates/                      # File templates
└── tests/                         # Test suites
```

## 🚀 For AI Assistants: Quick Decision Tree

```
START
  │
  ├─ User wants new userscript?
  │   ├─ Yes → Use AI_AUTOMATION_PROMPT.md
  │   └─ No ↓
  │
  ├─ User having problems?
  │   ├─ Yes → Use WEBMCP_USERSCRIPT_GUIDE.md (debugging section)
  │   └─ No ↓
  │
  ├─ User wants to understand?
  │   ├─ Yes → Use WEBMCP_USERSCRIPT_GUIDE.md (complete guide)
  │   └─ No ↓
  │
  └─ Need example?
      └─ Yes → Use
```

## ⚠️ Important Notes for AI

1. **Always use absolute paths** when injecting scripts:
   ```
   /path/to/WebMCP/webmcp-userscripts/scripts/[site]/dist/[site].user.js
   ```

2. **Tab IDs change frequently** - always re-fetch before use

3. **React sites need special handling** - use the React helpers from the guides

4. **Build before inject** - always run `pnpm run build` after changes

5. **Tools may not appear immediately** - reload tab and wait 1-2 seconds if needed

## 🔧 Technical Details

### Available MCP Tool Sets

1. **Playwright MCP** - Browser automation and selector discovery
2. **WebMCP Extension Tools** - Tab management and script injection
3. **Website Tools** - Appear after userscript injection (site-specific)

### Injection Tool Specifics

Tool name: `mcp_mcp-b_extension_tool_execute_user_script`
Parameters:
- `filePath`: Absolute path to built .user.js file
- `tabId`: Target browser tab ID

### Common Issues & Solutions

| Issue | Solution | Reference |
|-------|----------|-----------|
| Tools not appearing | Reload tab, wait 2s, list again | WEBMCP_USERSCRIPT_GUIDE.md |
| React text not working | Use native value setter |  |
| Can't find selectors | Use multiple strategies | WEBMCP_USERSCRIPT_GUIDE.md Phase 1 |
| Script won't inject | Check absolute path, rebuild | AI_AUTOMATION_PROMPT.md |

---

## Human-Readable Section

### About This Project

WebMCP Userscripts is a TypeScript monorepo for building Tampermonkey userscripts that inject MCP-B (Model Context Protocol - Browser) servers into websites. This enables AI assistants to interact with web applications through structured tools rather than brittle DOM manipulation.

### Key Features

- 🔧 TypeScript-first development with modern tooling
- 📦 Vite + vite-plugin-monkey for optimized userscript bundling
- 🧪 Automated testing with Puppeteer
- 🏗️ pnpm workspace monorepo structure
- 🎯 Pre-built MCP-B integration patterns
- ⚡ Hot reload development workflow

### For Developers

See the comprehensive guide in `WEBMCP_USERSCRIPT_GUIDE.md` for:
- Setting up development environment
- Creating new userscripts
- Testing and debugging
- **NEW: Production deployment and script registration**
- Contributing to the project

### Production Deployment (Latest Feature)

After testing your userscript, register it for automatic execution:

```javascript
mcp_mcp-b_extension_tool_userscripts_register({
  filePath: "/absolute/path/to/dist/script.user.js",
  id: "sitename-mcp-server",
  matches: ["https://domain/*"],
  runAt: "document_start",
  world: "MAIN"
})
```

Benefits: Auto-activation, no manual injection, persistent across sessions.

### License

MIT License - see [LICENSE](LICENSE) file for details.