import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  optimizeDeps: {
    include: ['@mcp-b/transports', '@modelcontextprotocol/sdk'],
  },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Gmail MCP-B Injector',
        namespace: 'https://github.com/miguelspizza/mcp-b-user-scripts',
        match: ['https://mail.google.com/*'],
        version: '1.0.0',
        description: 'Injects MCP-B server into Gmail for AI assistant integration',
        author: 'Alex Nahas',
        license: 'MIT',
        homepageURL: 'https://github.com/miguelspizza/mcp-b-user-scripts',
        supportURL: 'https://github.com/miguelspizza/mcp-b-user-scripts/issues',
      },
      build: {
        fileName: 'index.js', // Simple output name for injection
        metaFileName: false, // No metadata file needed
        autoGrant: false, // No GM grants needed
        externalGlobals: {}, // Bundle everything
      },
    }),
  ],
  build: {
    minify: true, // Minify for smaller injection size
    rollupOptions: {
      output: {
        format: 'iife', // Self-contained IIFE for injection
        inlineDynamicImports: true, // Bundle all dynamic imports
      },
    },
    target: 'esnext', // Modern browsers for Chrome extension
    sourcemap: false, // No sourcemaps for injected scripts
  },
});
