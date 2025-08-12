import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'SITE_NAME MCP-B Injector',
        namespace: 'https://github.com/miguelspizza/mcp-b-user-scripts',
        match: [
          // UPDATE THESE MATCH PATTERNS FOR YOUR SITE
          'https://your-site.com/*',
          'https://*.your-site.com/*',
        ],
        version: '1.0.0',
        description: 'Injects MCP-B server into SITE_NAME for AI assistant integration',
        author: 'Your Name',
        grant: ['none'], // Add GM_* grants if needed
        license: 'MIT',
        homepageURL: 'https://github.com/miguelspizza/mcp-b-user-scripts',
        supportURL: 'https://github.com/miguelspizza/mcp-b-user-scripts/issues',
        // Add updateURL and downloadURL for auto-updates if needed
        // updateURL: 'https://your-site.com/path/to/script.meta.js',
        // downloadURL: 'https://your-site.com/path/to/script.user.js',
      },
      build: {
        fileName: 'site-name.user.js', // UPDATE THIS
        metaFileName: true, // Generates .meta.js for update checks
        externalGlobals: {
          // Bundle dependencies inline to avoid CSP issues
          zod: cdn.jsdelivr('z', 'lib/index.umd.js'),
          // Add other dependencies if needed
        },
        autoGrant: true, // Automatically detect and add @grant directives
      },
      server: {
        open: true, // Auto-open script in browser during development
        prefix: 'dev:', // Prefix for development version
      },
    }),
  ],
  build: {
    minify: false, // Following Greasyfork rules (no minification)
  },
});