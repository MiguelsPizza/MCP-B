# MCP-B Browser Extension

AI-powered browser assistant with Model Context Protocol integration for enhanced web interactions.

## Development Setup

### Environment Configuration

1. Copy the example environment file:

   ```bash
   cp env.example .env
   ```

2. Update `.env` with your configuration:
   - `VITE_API_BASE_URL`: Base URL for the API server
   - `VITE_API_CHAT_ENDPOINT`: Chat API endpoint path
   - `VITE_CHAT_API_URL`: (Optional) Override the full chat API URL
   - `VITE_ENABLE_DEBUG_LOGGING`: Enable debug logging (default: false)
   - `VITE_MAX_CHAT_STEPS`: Maximum chat steps (default: 5)

### Running the Extension

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Configuration

The extension uses a centralized configuration system located in `entrypoints/sidepanel/lib/config.ts`. This provides:

- Type-safe access to configuration values
- Environment variable support with fallbacks
- Easy extensibility for new configuration options

### Adding New Configuration

To add new configuration options:

1. Update the `Config` interface in `lib/config.ts`
2. Add the environment variable to `env.example`
3. Use `config.yourNewOption` in your code

## Architecture

This extension is built with:

- [WXT](https://wxt.dev/) - Extension framework
- React + TypeScript
- Tailwind CSS for styling
- Model Context Protocol (MCP) for AI interactions
- Assistant UI for the chat interface
