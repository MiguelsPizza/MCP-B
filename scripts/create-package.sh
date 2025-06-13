#!/bin/bash

# Usage: ./scripts/create-package.sh package-name

PACKAGE_NAME=$1
PACKAGE_PATH="packages/$PACKAGE_NAME"

if [ -z "$PACKAGE_NAME" ]; then
  echo "Usage: ./scripts/create-package.sh package-name"
  exit 1
fi

# Create package directory structure
mkdir -p "$PACKAGE_PATH/src"

# Create package.json
cat > "$PACKAGE_PATH/package.json" << EOF
{
  "name": "@mcp-b/$PACKAGE_NAME",
  "version": "0.0.1",
  "description": "",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "build:packages": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .turbo .tsbuildinfo"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
EOF

# Create tsconfig.json
cat > "$PACKAGE_PATH/tsconfig.json" << EOF
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create tsup.config.ts
cat > "$PACKAGE_PATH/tsup.config.ts" << EOF
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  platform: 'browser',
})
EOF

# Create src/index.ts
cat > "$PACKAGE_PATH/src/index.ts" << EOF
// Export your modules here
export {}
EOF

# Create README.md
cat > "$PACKAGE_PATH/README.md" << EOF
# @mcp-b/$PACKAGE_NAME

Description of your package.

## Installation

\`\`\`bash
npm install @mcp-b/$PACKAGE_NAME
# or
yarn add @mcp-b/$PACKAGE_NAME
# or
pnpm add @mcp-b/$PACKAGE_NAME
\`\`\`

## Usage

\`\`\`typescript
import { } from '@mcp-b/$PACKAGE_NAME';
\`\`\`

## License

MIT
EOF

echo "✅ Package created at $PACKAGE_PATH"
echo "📦 Next steps:"
echo "   1. cd $PACKAGE_PATH"
echo "   2. Update the description in package.json"
echo "   3. Add your code to src/"
echo "   4. Run 'pnpm install' from the root"
echo "   5. Run 'pnpm build' to build the package" 