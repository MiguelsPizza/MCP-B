# NPM Publishing Guide

This guide explains how to publish packages to npm for the MCP-B monorepo.

## Automated Publishing (Recommended)

The repository includes two GitHub Actions workflows for publishing:

### 1. Simple Automatic Publishing (`publish-npm-simple.yml`)

This workflow automatically publishes packages when:
- Changes are pushed to the `main` branch
- Only the packages with actual code changes are published
- Version numbers are different from what's on npm

**How it works:**
1. Detects which packages have changed
2. Builds all packages
3. Publishes only changed packages with new versions

**To use:**
1. Update version in package.json
2. Commit and push to main
3. Workflow runs automatically

### 2. Changeset-based Publishing (`publish-npm.yml`)

This workflow uses changesets for coordinated releases:

**To use:**
1. Create a changeset: `pnpm changeset`
2. Select packages and version bump type
3. Commit the changeset file
4. Push to main
5. Workflow creates a PR with version updates
6. Merge PR to publish

## Manual Publishing

### Prerequisites

1. npm account with publish access to `@mcp-b` scope
2. npm access token (create at https://www.npmjs.com/settings/YOUR_USERNAME/tokens)
3. Add token to `~/.npmrc`:
   ```
   //registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN
   ```

### Publishing Steps

1. **Build all packages:**
   ```bash
   pnpm build:packages
   ```

2. **Update versions (choose one):**
   ```bash
   # Using changesets (recommended for coordinated releases)
   pnpm changeset
   pnpm changeset:version
   
   # Or manual version bumps
   pnpm version:patch  # 0.1.0 -> 0.1.1
   pnpm version:minor  # 0.1.0 -> 0.2.0
   pnpm version:major  # 0.1.0 -> 1.0.0
   ```

3. **Dry run:**
   ```bash
   pnpm publish:dry
   ```

4. **Publish:**
   ```bash
   pnpm publish:packages
   ```

## GitHub Secrets Setup

For automated publishing, add these secrets to your repository:

1. Go to Settings > Secrets and variables > Actions
2. Add `NPM_TOKEN` with your npm access token

## Version Management

### When to bump versions:

- **Patch (0.0.X)**: Bug fixes, documentation updates
- **Minor (0.X.0)**: New features, backwards compatible
- **Major (X.0.0)**: Breaking changes

### Package Dependencies

When updating a package that others depend on:
1. Update the dependency version
2. Ensure internal dependencies use `workspace:*`
3. Test all dependent packages

## Manual Workflow Trigger

You can manually trigger publishing:

1. Go to Actions tab
2. Select "Publish Changed Packages to npm"
3. Click "Run workflow"
4. Optionally specify packages (e.g., `transports,mcp-react-hooks`)
5. Click "Run workflow"

## Troubleshooting

### Version already exists
- Bump the version number before publishing
- Check npm for current version: `npm view @mcp-b/PACKAGE_NAME version`

### Authentication failed
- Verify NPM_TOKEN is set correctly
- Check token permissions (needs publish access)
- Try logging in manually: `npm login`

### Build errors
- Run `pnpm build:packages` locally
- Fix any TypeScript errors
- Ensure all dependencies are installed

## Published Packages

View all published packages at: https://www.npmjs.com/org/mcp-b

Current packages:
- [@mcp-b/transports](https://www.npmjs.com/package/@mcp-b/transports)
- [@mcp-b/mcp-react-hooks](https://www.npmjs.com/package/@mcp-b/mcp-react-hooks)
- [@mcp-b/extension-tools](https://www.npmjs.com/package/@mcp-b/extension-tools)
- [@mcp-b/web-tools](https://www.npmjs.com/package/@mcp-b/web-tools)
- [@mcp-b/mcp-react-hook-form](https://www.npmjs.com/package/@mcp-b/mcp-react-hook-form)