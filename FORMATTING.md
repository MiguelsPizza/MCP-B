# Code Formatting and Linting Setup

This project uses a consistent code formatting and linting setup across the monorepo.

## Tools Used

- **Prettier** - Code formatter for consistent style
- **ESLint** - Linter for catching errors and enforcing code quality
- **EditorConfig** - Ensures consistent coding styles across different editors

## Configuration Files

- `.prettierrc.json` - Prettier configuration
- `.prettierignore` - Files to exclude from Prettier formatting
- `eslint.config.js` - ESLint configuration (using flat config)
- `.editorconfig` - Editor configuration for consistent coding styles
- `.vscode/settings.json` - VSCode workspace settings

## Available Commands

### Format all files in the workspace

```bash
pnpm format
```

### Check formatting without making changes

```bash
pnpm format:check
```

### Run ESLint with auto-fix

```bash
pnpm lint
```

### Check linting without auto-fix

```bash
pnpm lint:check
```

### Run all checks (typecheck, lint, format)

```bash
pnpm check-all
```

## VSCode Integration

The workspace is configured to:

- Format on save using Prettier
- Fix ESLint errors on save
- Organize imports on save

Make sure you have these VSCode extensions installed:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- EditorConfig (`EditorConfig.EditorConfig`)

## Formatting Rules

### TypeScript/JavaScript

- Single quotes for strings
- Semicolons required
- 2 space indentation
- Trailing commas (ES5 style)
- 80 character line width
- Arrow function parentheses always

### Import Organization

Imports are automatically sorted in this order:

1. React imports
2. Third-party modules
3. Alias imports (`@/...`)
4. Relative imports

## Monorepo Considerations

The configuration files at the root apply to all packages in the monorepo. Individual packages can override settings if needed by creating their own configuration files.

## Installing Dependencies

The required ESLint packages have been added to the root `package.json`. Run:

```bash
pnpm install
```

This will install all necessary dependencies including the ESLint packages needed for the configuration.

## Notes

- The ESLint configuration uses a simplified setup without TypeScript project references to avoid complexity in the monorepo
- Generated files and build outputs are automatically excluded from linting and formatting
- The import sorting plugin for Prettier is configured but may require the `@ianvs/prettier-plugin-sort-imports` package to be installed
