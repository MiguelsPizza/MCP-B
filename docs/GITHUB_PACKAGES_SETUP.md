# GitHub Packages Setup Guide

This guide explains how to publish and install packages from GitHub Packages for the MCP-B monorepo.

## Prerequisites

1. GitHub Personal Access Token with the following permissions:
   - `write:packages` - To publish packages
   - `read:packages` - To install packages
   - `delete:packages` - To delete packages (optional)

2. GitHub Organization Setup (for organization owners):
   - Go to https://github.com/organizations/MiguelsPizza/settings/packages
   - Ensure GitHub Packages is enabled for your organization
   - Check package creation permissions

## Setting up Authentication

### 1. Create a Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `write:packages`
   - `read:packages`
   - `repo` (if working with private repositories)
4. Generate and copy the token

### 2. Configure Authentication

#### Option A: Using Environment Variable (Recommended)

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export GITHUB_TOKEN=your_token_here
```

#### Option B: Manual npm login

```bash
npm login --scope=@miguelspizza --auth-type=legacy --registry=https://npm.pkg.github.com

> Username: YOUR_GITHUB_USERNAME
> Password: YOUR_GITHUB_TOKEN
> Email: YOUR_EMAIL
```

## Publishing Packages

### Manual Publishing

1. Set up authentication:
   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```

2. Build all packages:
   ```bash
   pnpm build:packages
   ```

3. Bump versions (choose one):
   ```bash
   pnpm version:patch  # 0.1.0 -> 0.1.1
   pnpm version:minor  # 0.1.0 -> 0.2.0
   pnpm version:major  # 0.1.0 -> 1.0.0
   ```

4. Dry run to verify:
   ```bash
   pnpm publish:dry
   ```

5. Publish to GitHub Packages:
   ```bash
   GITHUB_TOKEN=$GITHUB_TOKEN pnpm publish:packages
   ```

### Authentication Helper Script

Run the authentication setup script:
```bash
./scripts/setup-github-packages-auth.sh
```

### Publishing Helper Script

For easier publishing with proper authentication:
```bash
export GITHUB_TOKEN=your_github_token_here
./scripts/publish-to-github-packages.sh
```

### Automated Publishing via GitHub Actions

1. Go to Actions tab in your repository
2. Select "Publish Packages to GitHub Packages" workflow
3. Click "Run workflow"
4. Choose version bump type
5. Click "Run workflow"

Or push a tag:
```bash
git tag v0.1.7
git push origin v0.1.7
```

## Installing Packages

### In Other Projects

1. Create `.npmrc` in your project root:
   ```
   @miguelspizza:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

2. Install packages:
   ```bash
   npm install @mcp-b/transports
   npm install @mcp-b/mcp-react-hooks
   npm install @mcp-b/extension-tools
   npm install @mcp-b/web-tools
   ```

### For Multiple Organizations

If you need packages from multiple organizations, add multiple registry entries to `.npmrc`:

```
@miguelspizza:registry=https://npm.pkg.github.com
@other-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Package Visibility

By default, packages are private to your organization. To make them public:

1. Go to https://github.com/orgs/MiguelsPizza/packages
2. Click on the package
3. Go to "Package settings"
4. Change visibility to "Public"

## Troubleshooting

### Authentication Errors

If you get 401 errors:
1. Verify your token has the correct permissions
2. Check that `GITHUB_TOKEN` is set: `echo $GITHUB_TOKEN`
3. Try logging in manually with npm login

### 404 Not Found

If packages can't be found:
1. Verify the package name matches exactly (case-sensitive)
2. Check that the package has been published
3. Ensure you have read permissions for the package

### Permission Denied

If you can't publish:
1. Verify you have write permissions to the repository
2. Check that your token has `write:packages` scope
3. Ensure the package name scope matches your organization

## Available Packages

- `@mcp-b/transports` - Browser transport implementations for MCP
- `@mcp-b/mcp-react-hooks` - React hooks for MCP integration
- `@mcp-b/extension-tools` - Chrome Extension API tools
- `@mcp-b/web-tools` - Browser API tools
- `@mcp-b/mcp-react-hook-form` - React Hook Form integration for MCP