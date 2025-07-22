# Contributing to MCP-B

Thank you for your interest in contributing to MCP-B! This guide will help you get started with development and understand the project structure.

## Quick Start

```bash
git clone https://github.com/MiguelsPizza/WebMCP.git
cd WebMCP
pnpm install
pnpm build:packages  # Build workspace packages first
pnpm dev  # Runs all in dev mode
```

## Project Structure

```
WebMCP/
├── examples/                # Example implementations
│   └── vanilla-ts/         # Simple todo app demo
├── packages/               # Core library packages
│   ├── transports/         # MCP transport implementations
│   ├── extension-tools/    # Browser extension utilities
│   ├── mcp-react-hooks/    # React hooks for MCP
│   └── web-tools/         # Web-specific MCP tools
├── extension/             # Chrome extension source
├── native-server/         # Native messaging host
├── web/                   # Documentation site
└── e2e-tests/            # End-to-end tests
```

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for running tests with `act`)

### Build Order Dependencies

⚠️ **Important**: This project has build order dependencies that must be respected:

1. **Always build packages first**: Run `pnpm build:packages` before other build commands
2. **Postinstall scripts depend on built packages**: The `native-server` package has postinstall scripts that require compiled JavaScript files

### Common Development Commands

```bash
# Install dependencies and build everything
pnpm install
pnpm build:packages
pnpm build

# Development mode (with hot reload)
pnpm dev

# Type checking
pnpm typecheck

# Linting and formatting
pnpm lint
pnpm format

# Testing
pnpm test
pnpm test:e2e
```

## Working with the Monorepo

This project uses:
- **pnpm workspaces** for package management
- **Turbo** for build orchestration
- **Biome** for linting and formatting

### Adding Dependencies

```bash
# Add to workspace root
pnpm add <package>

# Add to specific workspace
pnpm add <package> --filter @mcp-b/transports

# Add dev dependency
pnpm add -D <package>
```

### Creating New Packages

1. Create directory in `packages/`
2. Add `package.json` with workspace dependencies:
```json
{
  "name": "@mcp-b/your-package",
  "dependencies": {
    "@mcp-b/transports": "workspace:*"
  }
}
```
3. Add to `pnpm-workspace.yaml` if needed
4. Run `pnpm install` to link workspaces

## GitHub Actions & CI/CD

### Understanding the Build Pipeline

The CI pipeline has been optimized to handle build order dependencies:

1. **Install with `--ignore-scripts`**: Prevents postinstall scripts from running before packages are built
2. **Build packages first**: `pnpm build:packages` builds all workspace packages
3. **Run postinstall scripts**: `pnpm rebuild` runs any skipped postinstall scripts
4. **Complete build**: `pnpm build` builds applications (extension, web app, etc.)
5. **Type check**: `pnpm typecheck` verifies TypeScript types

### Testing CI Locally with `act`

Install and use `act` to test GitHub Actions workflows locally:

```bash
# Install act (macOS)
brew install act

# Test the CI workflow
act -W .github/workflows/ci.yml --container-architecture linux/amd64

# Test specific job
act -W .github/workflows/ci.yml -j typecheck --container-architecture linux/amd64
```

### Common CI Issues and Solutions

#### Postinstall Script Failures
**Problem**: `native-server` postinstall script fails with "Cannot find module"
**Solution**: Ensure packages are built before postinstall scripts run (already implemented in workflows)

#### Extension Typecheck Failures
**Problem**: Extension typecheck fails due to missing `.wxt` directory
**Solution**: Run full build before typecheck to generate required files (already implemented)

#### Playwright Dependencies
**Problem**: E2E tests fail due to missing system dependencies
**Solution**: Install system dependencies in CI environment

## Browser Extension Development

### Building the Extension

```bash
# Build for development
cd extension
pnpm build

# Build for production
cd extension
pnpm build --mode production

# Load in Chrome for testing
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select extension/.output/chrome-mv3/
```

### Extension Architecture

The extension uses:
- **WXT** for extension framework
- **React** + **TanStack Router** for UI
- **Assistant-UI** for chat interface
- **Chrome APIs** for native messaging and tabs

## Native Server Development

The native server enables communication between the browser extension and local MCP clients (like Claude Desktop).

### Building and Testing

```bash
cd native-server
pnpm build
pnpm dev  # Watch mode with auto-rebuild

# Install globally for testing
npm install -g .
mcp-chrome-bridge register  # Register with Chrome
```

### Postinstall Script

The native server includes a postinstall script that:
- Sets file permissions for executables
- Writes Node.js path for shell scripts
- Attempts to register Chrome native messaging host

## Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

E2E tests use Playwright and test:
- Extension installation and loading
- MCP tool registration and execution
- Cross-tab communication

### Manual Testing

1. **Build everything**: `pnpm build`
2. **Load extension** in Chrome (see extension development section)
3. **Run example apps**: `cd examples/vanilla-ts && pnpm dev`
4. **Test tool execution** via extension chat or inspector

## Debugging

### Extension Debugging

1. Open Chrome DevTools for extension pages:
   - Right-click extension icon → "Inspect popup"
   - Go to chrome://extensions → Click "inspect views"

2. Check console logs in:
   - Extension background script
   - Extension sidepanel
   - Website content scripts

### Native Server Debugging

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Or specific modules
DEBUG=mcp:* pnpm dev
```

## Publishing

### NPM Packages

Packages are published automatically via GitHub Actions when:
- Changes are pushed to `main` branch
- Package versions are updated
- Changesets are created

Manual publishing:
```bash
pnpm changeset  # Create changeset
pnpm changeset:version  # Update versions
pnpm changeset:publish  # Publish to npm
```

### Chrome Extension

The extension is published to Chrome Web Store manually by maintainers.

## Code Style

This project uses Biome for consistent code formatting and linting:

```bash
# Format code
pnpm format

# Check formatting
pnpm format:check

# Lint code
pnpm lint

# Check everything
pnpm check:ci
```

### Git Hooks

Pre-commit hooks run automatically via Husky:
- Format changed files
- Run lint checks
- Verify commit message format

## Contribution Guidelines

### Before Contributing

1. Check existing issues and PRs
2. For new features, open an issue first to discuss
3. Follow the code style and testing requirements
4. Update documentation as needed

### PR Requirements

- [ ] All tests pass
- [ ] Code is formatted with Biome
- [ ] TypeScript types are correct
- [ ] Changes are documented
- [ ] Commit messages follow conventional format

### Focus Areas

We especially welcome contributions in:

- **Transports**: New MCP transport implementations
- **Examples**: Demos showing MCP-B integration patterns
- **Documentation**: Guides, tutorials, API docs
- **Testing**: Unit tests, E2E tests, edge cases
- **Browser Support**: Firefox/Safari compatibility
- **Performance**: Optimization and caching improvements

## Getting Help

- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Email**: Reach out to alexnahasdev@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.