import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  optimizeDeps: {
    include: ['gmail-js'],
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
        grant: [
          'GM.info',
          'GM.setValue',
          'GM.getValue',
          'GM.listValues',
          'GM.deleteValue',
          'unsafeWindow',
        ],
        license: 'MIT',
        homepageURL: 'https://github.com/miguelspizza/mcp-b-user-scripts',
        supportURL: 'https://github.com/miguelspizza/mcp-b-user-scripts/issues',
      },
      build: {
        fileName: 'gmail.user.js',
        metaFileName: true,
        autoGrant: true,
      },
      server: {
        open: true,
        prefix: 'dev:',
      },
    }),
  ],
  build: {
    minify: false,
  },
});
