// import {
//   BACKGROUND_MESSAGE_TYPES,
//   ERROR_MESSAGES,
//   NATIVE_HOST,
//   NativeMessageType,
//   NativeServerTransport,
//   type ServerStatus,
//   STORAGE_KEYS,
//   SUCCESS_MESSAGES,
// } from '@mcp-b/transports';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import McpHub from './mcpHub';

// let currentServerStatus: ServerStatus = {
//   isRunning: false,
//   lastUpdated: Date.now(),
// };

// let nativePort: chrome.runtime.Port | null = null;

// let startResolve: ((port: chrome.runtime.Port) => void) | null = null;
// let startReject: ((reason: any) => void) | null = null;
// let stopResolve: (() => void) | null = null;
// let stopReject: ((reason: any) => void) | null = null;

// /**
//  * Save server status to chrome.storage
//  */
// async function saveServerStatus(status: ServerStatus): Promise<void> {
//   console.log(`[native] Saving server status:`, status);
//   try {
//     await chrome.storage.local.set({ [STORAGE_KEYS.SERVER_STATUS]: status });
//     console.log(`[native] Server status saved successfully`);
//   } catch (error) {
//     console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_SAVE_FAILED}:`, error);
//   }
// }

// /**
//  * Load server status from chrome.storage
//  */
// async function loadServerStatus(): Promise<ServerStatus> {
//   console.log(`[native] Loading server status from storage`);
//   try {
//     const result = await chrome.storage.local.get([STORAGE_KEYS.SERVER_STATUS]);
//     if (result[STORAGE_KEYS.SERVER_STATUS]) {
//       console.log(`[native] Server status loaded:`, result[STORAGE_KEYS.SERVER_STATUS]);
//       return result[STORAGE_KEYS.SERVER_STATUS];
//     }
//     console.log(`[native] No stored server status found, using default`);
//   } catch (error) {
//     console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
//   }
//   return {
//     isRunning: false,
//     lastUpdated: Date.now(),
//   };
// }

// /**
//  * Broadcast server status change to all listeners
//  */
// function broadcastServerStatusChange(status: ServerStatus): void {
//   console.log(`[native] Broadcasting server status change:`, status);
//   chrome.runtime
//     .sendMessage({
//       type: BACKGROUND_MESSAGE_TYPES.SERVER_STATUS_CHANGED,
//       payload: status,
//     })
//     .catch(() => {
//       // Ignore errors if no listeners are present
//       console.log(`[native] No listeners for server status change broadcast`);
//     });
// }

// const messageListener = (message: any) => {
//   console.log(`[native] Received message from native host:`, message);

//   if (message.type === NativeMessageType.SERVER_STARTED) {
//     const port = message.payload?.port;
//     console.log(`[native] Server started notification received for port ${port}`);

//     currentServerStatus = {
//       isRunning: true,
//       port: port,
//       lastUpdated: Date.now(),
//     };
//     saveServerStatus(currentServerStatus);
//     broadcastServerStatusChange(currentServerStatus);
//     console.log(`[native] ${SUCCESS_MESSAGES.SERVER_STARTED} on port ${port}`);

//     if (startResolve && nativePort) {
//       startResolve(nativePort);
//       startResolve = null;
//       startReject = null;
//     }
//   } else if (message.type === NativeMessageType.SERVER_STOPPED) {
//     console.log(`[native] Server stopped notification received`);

//     currentServerStatus = {
//       isRunning: false,
//       port: currentServerStatus.port, // Keep last known port for reconnection
//       lastUpdated: Date.now(),
//     };
//     saveServerStatus(currentServerStatus);
//     broadcastServerStatusChange(currentServerStatus);
//     console.log(`[native] ${SUCCESS_MESSAGES.SERVER_STOPPED}`);

//     if (stopResolve) {
//       stopResolve();
//       stopResolve = null;
//       stopReject = null;
//     }
//   } else if (message.type === NativeMessageType.ERROR_FROM_NATIVE_HOST) {
//     const errorMessage = message.payload?.message || 'Unknown error';
//     console.error(`[native] Error from native host: ${errorMessage}`);
//     const err = new Error(errorMessage);

//     if (startReject) {
//       startReject(err);
//       startResolve = null;
//       startReject = null;
//     }
//     if (stopReject) {
//       stopReject(err);
//       stopResolve = null;
//       stopReject = null;
//     }
//   } else {
//     console.log(`[native] Unhandled message type: ${message.type}`);
//   }
// };

// const disconnectListener = () => {
//   const lastError = chrome.runtime.lastError;
//   console.error(
//     `[native] ${ERROR_MESSAGES.NATIVE_DISCONNECTED}`,
//     JSON.stringify(lastError, null, 2)
//   );
//   nativePort = null;
//   currentServerStatus = {
//     ...currentServerStatus,
//     isRunning: false,
//     lastUpdated: Date.now(),
//   };
//   saveServerStatus(currentServerStatus);
//   broadcastServerStatusChange(currentServerStatus);
// };

// /**
//  * Connect to the native messaging host and perform initial handshake
//  */
// export async function connectNativeHost(
//   portNumber: number = NATIVE_HOST.DEFAULT_PORT
// ): Promise<chrome.runtime.Port> {
//   console.log(`[native] Attempting to connect to native host on port ${portNumber}`);

//   if (nativePort) {
//     console.log(`[native] Native port already connected, skipping connection attempt`);
//     return nativePort;
//   }

//   try {
//     console.log(`[native] Creating native port connection to ${NATIVE_HOST.NAME}`);
//     nativePort = chrome.runtime.connectNative(NATIVE_HOST.NAME);

//     nativePort.onMessage.addListener(messageListener);
//     nativePort.onDisconnect.addListener(disconnectListener);

//     const startMessage = { type: NativeMessageType.START, payload: { port: portNumber } };
//     console.log(`[native] Sending START message to native host:`, startMessage);
//     nativePort.postMessage(startMessage);

//     // Wait for SERVER_STARTED handshake before proceeding
//     await new Promise((resolve, reject) => {
//       startResolve = resolve;
//       startReject = reject;
//     });

//     // Now connect the MCP server after handshake confirmation
//     const server = new McpServer({ name: 'Extension-Hub-Native', version: '1.0.0' });
//     new McpHub(server, nativePort);
//     await server.connect(new NativeServerTransport(nativePort));

//     return nativePort;
//   } catch (error) {
//     console.error(`[native] ${ERROR_MESSAGES.NATIVE_CONNECTION_FAILED}:`, error);
//     if (nativePort) {
//       nativePort.disconnect();
//       nativePort = null;
//     }
//     throw error;
//   }
// }

// /**
//  * Disconnect from the native messaging host and perform stop handshake
//  */
// export async function disconnectNativeHost(): Promise<void> {
//   console.log(`[native] Disconnecting from native host`);

//   if (!nativePort) {
//     console.log(`[native] No active connection to disconnect`);
//     return;
//   }

//   const stopMessage = { type: NativeMessageType.STOP };
//   console.log(`[native] Sending STOP message to native host:`, stopMessage);
//   nativePort.postMessage(stopMessage);

//   await new Promise<void>((resolve, reject) => {
//     stopResolve = resolve;
//     stopReject = reject;
//   });

//   nativePort.disconnect();
//   nativePort = null;
//   console.log(`[native] Native port disconnected successfully`);
// }

// /**
//  * Initialize native host listeners and load initial state
//  */
// export const initNativeHostListener = () => {
//   console.log(`[native] Initializing native host listener`);

//   // Initialize server status from storage
//   loadServerStatus()
//     .then((status) => {
//       currentServerStatus = status;
//       console.log(`[native] Server status loaded:`, currentServerStatus);
//     })
//     .catch((error) => {
//       console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
//     });

//   connectNativeHost()
//     .then(() => {
//       // sendResponse({ success: true, port });

//       console.log(`[native] CONNECT_NATIVE response sent`);
//     })
//     .catch((error) => {
//       // sendResponse({ success: false, error: error.message });
//       console.log(
//         `[native] CONNECT_NATIVE error response sent ${JSON.stringify(error.message, null, 2)}`
//       );
//     });

//   chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//     console.log(`[native] Received runtime message:`, message);

//     if (
//       message === NativeMessageType.CONNECT_NATIVE ||
//       message.type === NativeMessageType.CONNECT_NATIVE
//     ) {
//       const port =
//         typeof message === 'object' && message.port ? message.port : NATIVE_HOST.DEFAULT_PORT;
//       console.log(`[native] CONNECT_NATIVE request received for port ${port}`);

//       return true;
//     }

//     if (message.type === NativeMessageType.PING_NATIVE) {
//       const connected = nativePort !== null;
//       console.log(`[native] PING_NATIVE request received, connected: ${connected}`);
//       sendResponse({ connected });
//       return true;
//     }

//     if (message.type === NativeMessageType.DISCONNECT_NATIVE) {
//       console.log(`[native] DISCONNECT_NATIVE request received`);

//       disconnectNativeHost()
//         .then(() => {
//           sendResponse({ success: true });
//           console.log(`[native] DISCONNECT_NATIVE response sent`);
//         })
//         .catch((error) => {
//           sendResponse({ success: false, error: error.message });
//           console.log(`[native] DISCONNECT_NATIVE error response sent`);
//         });
//       return true;
//     }

//     if (message.type === BACKGROUND_MESSAGE_TYPES.GET_SERVER_STATUS) {
//       console.log(`[native] GET_SERVER_STATUS request received`);
//       const response = {
//         success: true,
//         serverStatus: currentServerStatus,
//         connected: nativePort !== null,
//       };
//       console.log(`[native] GET_SERVER_STATUS response:`, response);
//       sendResponse(response);
//       return true;
//     }

//     if (message.type === BACKGROUND_MESSAGE_TYPES.REFRESH_SERVER_STATUS) {
//       console.log(`[native] REFRESH_SERVER_STATUS request received`);

//       loadServerStatus()
//         .then((storedStatus) => {
//           currentServerStatus = storedStatus;
//           const response = {
//             success: true,
//             serverStatus: currentServerStatus,
//             connected: nativePort !== null,
//           };
//           console.log(`[native] REFRESH_SERVER_STATUS response:`, response);
//           sendResponse(response);
//         })
//         .catch((error) => {
//           console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
//           const errorResponse = {
//             success: false,
//             error: ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED,
//             serverStatus: currentServerStatus,
//             connected: nativePort !== null,
//           };
//           console.log(`[native] REFRESH_SERVER_STATUS error response:`, errorResponse);
//           sendResponse(errorResponse);
//         });
//       return true;
//     }

//     console.log(`[native] Unhandled runtime message type:`, message.type || 'unknown');
//   });

//   console.log(`[native] Native host listener initialization complete`);
// };

// // chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
// //   console.log(`[native] Received runtime message:`, message);

// //   if (
// //     message === NativeMessageType.CONNECT_NATIVE ||
// //     message.type === NativeMessageType.CONNECT_NATIVE
// //   ) {
// //     const port =
// //       typeof message === 'object' && message.port ? message.port : NATIVE_HOST.DEFAULT_PORT;
// //     console.log(`[native] CONNECT_NATIVE request received for port ${port}`);

// //     connectNativeHost(port, client);
// //     sendResponse({ success: true, port });
// //     console.log(`[native] CONNECT_NATIVE response sent`);
// //     return true;
// //   }

// //   if (message.type === NativeMessageType.PING_NATIVE) {
// //     const connected = nativePort !== null;
// //     console.log(`[native] PING_NATIVE request received, connected: ${connected}`);
// //     sendResponse({ connected });
// //     return true;
// //   }

// //   if (message.type === NativeMessageType.DISCONNECT_NATIVE) {
// //     console.log(`[native] DISCONNECT_NATIVE request received`);

// //     if (nativePort) {
// //       nativePort.disconnect();
// //       nativePort = null;
// //       console.log(`[native] Native port disconnected successfully`);
// //       sendResponse({ success: true });
// //     } else {
// //       console.log(`[native] No active connection to disconnect`);
// //       sendResponse({ success: false, error: 'No active connection' });
// //     }
// //     return true;
// //   }

// //   if (message.type === BACKGROUND_MESSAGE_TYPES.GET_SERVER_STATUS) {
// //     console.log(`[native] GET_SERVER_STATUS request received`);
// //     const response = {
// //       success: true,
// //       serverStatus: currentServerStatus,
// //       connected: nativePort !== null,
// //     };
// //     console.log(`[native] GET_SERVER_STATUS response:`, response);
// //     sendResponse(response);
// //     return true;
// //   }

// //   if (message.type === BACKGROUND_MESSAGE_TYPES.REFRESH_SERVER_STATUS) {
// //     console.log(`[native] REFRESH_SERVER_STATUS request received`);

// //     loadServerStatus()
// //       .then((storedStatus) => {
// //         currentServerStatus = storedStatus;
// //         const response = {
// //           success: true,
// //           serverStatus: currentServerStatus,
// //           connected: nativePort !== null,
// //         };
// //         console.log(`[native] REFRESH_SERVER_STATUS response:`, response);
// //         sendResponse(response);
// //       })
// //       .catch((error) => {
// //         console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
// //         const errorResponse = {
// //           success: false,
// //           error: ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED,
// //           serverStatus: currentServerStatus,
// //           connected: nativePort !== null,
// //         };
// //         console.log(`[native] REFRESH_SERVER_STATUS error response:`, errorResponse);
// //         sendResponse(errorResponse);
// //       });
// //     return true;
// //   }

// //   console.log(`[native] Unhandled runtime message type:`, message.type || 'unknown');
// // });
