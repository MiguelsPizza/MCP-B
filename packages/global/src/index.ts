// index.ts

import { initializeGlobalMCP } from './global.js';

let isInitialized = false;
// export { initializeGlobalMCP } from './global.js';
// export * from './types.js';

// Auto-initialize when script loads in browser environments
// Using DOMContentLoaded for better timing instead of setTimeout(0), ensuring DOM is ready
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      initializeGlobalMCP(isInitialized);
      if (typeof window.mcp !== 'undefined') {
        isInitialized = true;
        console.log('window.mcp', window.mcp);
        console.log('✅ MCP Ready!');
      }else{

        console.error('❌ MCP Not Ready!');
      }
    } catch (error) {
      console.error('Auto-initialization of global MCP failed:', error);
    }
}

// For manual initialization (when using as ES module)
export default initializeGlobalMCP;
