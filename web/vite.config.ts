import path from 'path';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from "vite-plugin-svgr";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Router plugin for automatic route generation
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    // React plugin with Fast Refresh
    react(),
    // Tailwind CSS plugin
    tailwindcss(),
    // Cloudflare plugin for deployment
    cloudflare(),
    svgr()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
