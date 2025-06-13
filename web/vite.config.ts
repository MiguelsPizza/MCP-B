import path from 'path';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Router plugin for automatic route generation
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
    }),
    // React plugin with Fast Refresh
    react(),
    // Tailwind CSS plugin
    tailwindcss(),
    // Cloudflare plugin for deployment
    cloudflare(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
