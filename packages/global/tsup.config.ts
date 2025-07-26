import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'mcpBrowser',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  target: 'es2018',
  platform: 'browser',
  external: ['node:process', 'node:stream'],
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'globalThis',
  },
  esbuildOptions: (options) => {
    options.banner = {
      js: '// @mcp-b/global - MIT License',
    };
  },
  outExtension({ format }) {
    return {
      js: `.${format === 'iife' ? 'umd.js' : format === 'cjs' ? 'cjs' : 'js'}`,
    };
  },
});
