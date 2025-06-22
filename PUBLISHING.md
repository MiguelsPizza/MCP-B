# Publishing Guide for MCP-B Packages

This guide explains how to publish the MCP-B npm packages using the consistent scripts configured with Turbo.

## Available Packages

- `@mcp-b/transports` - Transport protocols for browser MCP
- `@mcp-b/extension-tools` - Chrome Extension API tools for MCP
- `@mcp-b/mcp-react-hooks` - React hooks for MCP client

## Publishing Commands

All commands can be run from the monorepo root and will execute in parallel for all packages:

### Build Packages

```bash
# Build all packages in parallel
pnpm build:packages
```

### Version Management

```bash
# Bump patch version for all packages (0.0.1 -> 0.0.2)
pnpm version:patch

# Bump minor version for all packages (0.0.1 -> 0.1.0)
pnpm version:minor

# Bump major version for all packages (0.0.1 -> 1.0.0)
pnpm version:major
```

### Publishing

```bash
# Dry run - see what would be published without actually publishing
pnpm publish:dry

# Publish all packages to npm
pnpm publish:packages
```

## Publishing Individual Packages

If you need to publish a specific package:

```bash
# Navigate to the package directory
cd packages/transports

# Version bump
pnpm version:patch

# Publish
pnpm publish:npm
```

## Publishing Workflow

1. **Ensure everything builds and tests pass:**

   ```bash
   pnpm check-all
   ```

2. **Bump versions as needed:**

   ```bash
   pnpm version:patch
   ```

3. **Do a dry run to verify:**

   ```bash
   pnpm publish:dry
   ```

4. **Publish to npm:**

   ```bash
   pnpm publish:packages
   ```

5. **Commit and push version changes:**
   ```bash
   git add .
   git commit -m "chore: bump package versions"
   git push
   ```

## Authentication

Make sure you're authenticated with npm before publishing:

```bash
npm login
```

Or set the `NPM_TOKEN` environment variable for CI/CD workflows.

## Notes

- The `prepublishOnly` script automatically runs the build before publishing
- The `--no-git-checks` flag is used to allow publishing even with uncommitted changes
- All packages are published with `public` access by default
- Turbo will run the publish commands in parallel for efficiency
