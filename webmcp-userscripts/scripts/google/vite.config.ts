import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Google MCP-B Injector',
        namespace: 'https://github.com/WebMCP-org/webmcp-userscripts',
        match: ['https://www.google.com/*'],
        version: '1.0.0',
        description: 'Injects an MCP-B server into Google.com pages for simple page tools',
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
        homepageURL: 'https://github.com/WebMCP-org/webmcp-userscripts',
        supportURL: 'https://github.com/WebMCP-org/webmcp-userscripts/issues',
      },
      build: {
        fileName: 'google.user.js',
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
