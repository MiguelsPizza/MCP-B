import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Hacker News MCP-B Injector',
        namespace: 'https://github.com/WebMCP-org/webmcp-userscripts',
        match: ['https://news.ycombinator.com/*'],
        version: '1.0.0',
        description: 'Injects an MCP-B server into Hacker News to read posts and click into them',
        author: 'Alex Nahas',
        grant: ['GM.info', 'unsafeWindow'],
        license: 'MIT',
        homepageURL: 'https://github.com/WebMCP-org/webmcp-userscripts',
        supportURL: 'https://github.com/WebMCP-org/webmcp-userscripts/issues',
      },
      build: {
        fileName: 'hackernews.user.js',
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
