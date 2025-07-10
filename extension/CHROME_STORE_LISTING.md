# Chrome Web Store Listing Information

## Extension Details

### Name

MCP-B Browser Assistant

### Short Description (132 characters max)

AI-powered browser assistant with Model Context Protocol (MCP) integration for enhanced web interactions and task management.

### Detailed Description

MCP-B is a powerful browser extension that brings AI assistance directly into your browser through the Model Context Protocol (MCP).

Key Features:
• AI-powered chat interface in the browser side panel
• Real-time interaction with web pages and browser tabs
• Task and todo management with AI assistance
• Browser automation capabilities
• Secure local processing with customizable AI providers
• Cross-browser compatibility (Chrome, Edge, Firefox)

The extension provides a standardized way for AI assistants to interact with your browser, enabling features like:

- Smart tab management and navigation
- Content extraction and analysis
- Browser history and bookmark integration
- Real-time page interaction through content scripts

Perfect for developers, researchers, and power users who want to enhance their browsing experience with AI capabilities.

### Category

Productivity

### Language

English

## Privacy Policy

Your extension uses the following permissions that require justification:

### Host Permissions: <all_urls>

This permission is required to enable the AI assistant to interact with any webpage the user visits. The extension only accesses page content when explicitly requested by the user through the chat interface.

### Permission Justifications

**storage**: Used to save user preferences, chat history, and MCP configuration settings locally.

**tabs**: Required for the AI assistant to manage browser tabs, including creating, closing, and navigating tabs as requested by the user.

**tabGroups**: Enables intelligent tab organization features, allowing the AI to group related tabs together.

**sidePanel**: Core functionality - provides the chat interface where users interact with the AI assistant.

**webNavigation**: Necessary for the AI to understand navigation events and provide context-aware assistance.

**bookmarks**: Allows the AI assistant to search and manage bookmarks when requested by the user.

**windows**: Enables window management features for the AI assistant to organize browser windows.

**history**: Permits the AI to search browsing history to provide contextual assistance (only when user requests).

### Data Usage

- All data processing happens locally in the browser
- No user data is collected or transmitted to external servers without explicit user consent
- AI provider credentials are stored securely in browser storage
- Chat history is stored locally and can be cleared by the user at any time

### Privacy Policy URL

https://your-domain.com/privacy

## Store Assets Needed

### Screenshots (1280x800 or 640x400)

You need at least 1 screenshot, maximum 5:

1. Main chat interface in action
2. Task management features
3. Browser automation example
4. Settings/configuration page
5. Multiple AI provider support

### Promotional Images (Optional)

- Small tile: 440x280
- Large tile: 920x680
- Marquee: 1400x560

### Support Information

- Support email: support@your-domain.com
- Website: https://your-domain.com/extension

## Pre-submission Checklist

- [x] Update extension name in package.json and wxt.config.ts
- [x] Replace "manifest.json description" with actual description
- [ ] Create and upload screenshots
- [x] Write and host privacy policy (available at /privacy)
- [ ] Create promotional images (optional)
- [ ] Set up support email and website (update placeholder domains)
- [ ] Test extension in production mode
- [ ] Run `pnpm build` and `pnpm zip` to create submission package
