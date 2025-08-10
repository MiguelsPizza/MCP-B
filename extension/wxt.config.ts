import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  name: 'MCP-B Browser Assistant',
  description:
    'AI-powered browser assistant with Model Context Protocol integration for enhanced web interactions',
  // @ts-expect-error - vite is not a valid plugin
  vite: (env) => ({
    plugins: [
      tailwindcss(),
      tanstackRouter({
        generatedRouteTree: './entrypoints/sidepanel/routeTree.gen.ts',
        routesDirectory: './entrypoints/sidepanel/routes',
      }),
    ],
  }),
  manifestVersion: 3,
  manifest: {
    minimum_chrome_version: '120',
    host_permissions: ['<all_urls>'],
    permissions: [
      'storage',
      'tabs',
      'tabGroups',
      'sidePanel',
      'webNavigation',
      'bookmarks',
      'windows',
      'history',
      'userScripts',
      'nativeMessaging', // Enable communication with native hosts
      'scripting', // Enable scripting API for early injection
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000 http://localhost:3001; object-src 'self'; style-src 'self' 'unsafe-inline' https: http:; font-src 'self' https: data:; connect-src 'self' data: ws: wss: http: https:; img-src 'self' data: https: http:;",
    },
    action: {
      default_title: 'Open Side Panel',
      default_icon: {
        '16': 'icon/16.png',
        '24': 'icon/48.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
  cross_origin_embedder_policy: {
    value: 'require-corp',
  },
  cross_origin_opener_policy: {
    value: 'same-origin',
  },
  runner: {
    openConsole: true,
    openDevtools: true,
    startUrls: ['http://gmail.com'],
  },
});
