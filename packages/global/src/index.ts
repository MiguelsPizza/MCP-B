// index.ts

import { initializeGlobalMCP } from './global.js';

export * from './types.js';
export { initializeGlobalMCP, cleanupGlobalMCP } from './global.js';

// Auto-initialize when script loads in browser environments
// Using DOMContentLoaded for better timing instead of setTimeout(0), ensuring DOM is ready
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const autoInitialize = () => {
    try {
      initializeGlobalMCP();
    } catch (error) {
      console.error('Auto-initialization of global MCP failed:', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }
}

// For manual initialization (when using as ES module)
export default initializeGlobalMCP;
