// import type { MCPBrowserInterface } from '../browser-types';
// import type { BridgeMessage, PageBridgeMessageType } from './uiConnector.js';

// /**
//  * This script must run in the page context (e.g. injected via chrome.scripting).
//  * It bridges window.mcp.connect() <→> window.postMessage for EXT-CS / EXT-PAGE.
//  */
// (function injectPageBridge() {
//   const mcpGlobal = (window as any).mcp as MCPBrowserInterface;
//   if (!mcpGlobal || typeof mcpGlobal.connect !== 'function') {
//     console.warn('MCP extension bridge: window.mcp not available');
//     return;
//   }
//   const ports = new Map<string, MessagePort>();

//   window.addEventListener('message', (e: MessageEvent) => {
//     if (e.source !== window || e.data?.source !== 'EXT-CS') return;

//     // Assuming e.data has 'source' and the rest matches BridgeMessage structure
//     const eventData = e.data as BridgeMessage & { source: 'EXT-CS' };
//     const { cmd, clientId, options, message } = eventData;

//     if (cmd === 'connect') {
//       const port = mcpGlobal.connect(clientId, options); // options is already MCPConnectOptions | undefined from BridgeMessage
//       if (!port) {
//         console.error(`MCP bridge: connect failed for ${clientId}`);
//         return;
//       }
//       ports.set(clientId, port);
//       port.onmessage = (ev: MessageEvent<PageBridgeMessageType>) => {
//         window.postMessage({ source: 'EXT-PAGE', clientId, msg: ev.data }, '*');
//       };
//       port.start();
//     } else if (cmd === 'send') {
//       const port = ports.get(clientId);
//       if (port)
//         port.postMessage(message); // message is already JSONRPCMessage | undefined from BridgeMessage
//       else console.error(`MCP bridge: no port for ${clientId}`);
//     }
//   });
// })();
