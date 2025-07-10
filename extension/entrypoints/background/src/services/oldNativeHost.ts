import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

enum NativeMessageType {
  START = 'start',
  STARTED = 'started',
  STOP = 'stop',
  STOPPED = 'stopped',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  PROCESS_DATA = 'process_data',
  PROCESS_DATA_RESPONSE = 'process_data_response',
  CALL_TOOL = 'call_tool',
  CALL_TOOL_RESPONSE = 'call_tool_response',
  // Additional message types used in Chrome extension
  SERVER_STARTED = 'server_started',
  SERVER_STOPPED = 'server_stopped',
  ERROR_FROM_NATIVE_HOST = 'error_from_native_host',
  CONNECT_NATIVE = 'connectNative',
  PING_NATIVE = 'ping_native',
  DISCONNECT_NATIVE = 'disconnect_native',
  LIST_TOOLS = 'list_tools',
}

/**
 * Chrome Extension Constants
 * Centralized configuration values and magic constants
 */

// Native Host Configuration
export const NATIVE_HOST = {
  NAME: 'com.chromemcp.nativehost',
  DEFAULT_PORT: 12306,
} as const;

// Chrome Extension Icons
export const ICONS = {
  NOTIFICATION: 'icon/48.png',
} as const;

// Timeouts and Delays (in milliseconds)
export const TIMEOUTS = {
  DEFAULT_WAIT: 1000,
  NETWORK_CAPTURE_MAX: 30000,
  NETWORK_CAPTURE_IDLE: 3000,
  SCREENSHOT_DELAY: 100,
  KEYBOARD_DELAY: 50,
  CLICK_DELAY: 100,
} as const;

// Limits and Thresholds
export const LIMITS = {
  MAX_NETWORK_REQUESTS: 100,
  MAX_SEARCH_RESULTS: 50,
  MAX_BOOKMARK_RESULTS: 100,
  MAX_HISTORY_RESULTS: 100,
  SIMILARITY_THRESHOLD: 0.1,
  VECTOR_DIMENSIONS: 384,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NATIVE_CONNECTION_FAILED: 'Failed to connect to native host',
  NATIVE_DISCONNECTED: 'Native connection disconnected',
  SERVER_STATUS_LOAD_FAILED: 'Failed to load server status',
  SERVER_STATUS_SAVE_FAILED: 'Failed to save server status',
  TOOL_EXECUTION_FAILED: 'Tool execution failed',
  INVALID_PARAMETERS: 'Invalid parameters provided',
  PERMISSION_DENIED: 'Permission denied',
  TAB_NOT_FOUND: 'Tab not found',
  ELEMENT_NOT_FOUND: 'Element not found',
  NETWORK_ERROR: 'Network error occurred',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TOOL_EXECUTED: 'Tool executed successfully',
  CONNECTION_ESTABLISHED: 'Connection established',
  SERVER_STARTED: 'Server started successfully',
  SERVER_STOPPED: 'Server stopped successfully',
} as const;

// File Extensions and MIME Types
export const FILE_TYPES = {
  STATIC_EXTENSIONS: [
    '.css',
    '.js',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
  ],
  FILTERED_MIME_TYPES: ['text/html', 'text/css', 'text/javascript', 'application/javascript'],
  IMAGE_FORMATS: ['png', 'jpeg', 'webp'] as const,
} as const;

// Network Filtering
export const NETWORK_FILTERS = {
  EXCLUDED_DOMAINS: [
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.com',
    'doubleclick.net',
    'googlesyndication.com',
  ],
  STATIC_RESOURCE_TYPES: ['stylesheet', 'image', 'font', 'media', 'other'],
} as const;

// Semantic Similarity Configuration
export const SEMANTIC_CONFIG = {
  DEFAULT_MODEL: 'sentence-transformers/all-MiniLM-L6-v2',
  CHUNK_SIZE: 512,
  CHUNK_OVERLAP: 50,
  BATCH_SIZE: 32,
  CACHE_SIZE: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SERVER_STATUS: 'serverStatus',
  SEMANTIC_MODEL: 'semanticModel',
  USER_PREFERENCES: 'userPreferences',
  VECTOR_INDEX: 'vectorIndex',
} as const;

// Notification Configuration
export const NOTIFICATIONS = {
  PRIORITY: 2,
  TYPE: 'basic' as const,
} as const;

export enum ExecutionWorld {
  ISOLATED = 'ISOLATED',
  MAIN = 'MAIN',
}

/**
 * Consolidated message type constants for Chrome extension communication
 * Note: Native message types are imported from the shared package
 */

// Message targets for routing
export enum MessageTarget {
  Offscreen = 'offscreen',
  ContentScript = 'content_script',
  Background = 'background',
}

// Background script message types
export const BACKGROUND_MESSAGE_TYPES = {
  SWITCH_SEMANTIC_MODEL: 'switch_semantic_model',
  GET_MODEL_STATUS: 'get_model_status',
  UPDATE_MODEL_STATUS: 'update_model_status',
  GET_STORAGE_STATS: 'get_storage_stats',
  CLEAR_ALL_DATA: 'clear_all_data',
  GET_SERVER_STATUS: 'get_server_status',
  REFRESH_SERVER_STATUS: 'refresh_server_status',
  SERVER_STATUS_CHANGED: 'server_status_changed',
  INITIALIZE_SEMANTIC_ENGINE: 'initialize_semantic_engine',
} as const;

// Offscreen message types
export const OFFSCREEN_MESSAGE_TYPES = {
  SIMILARITY_ENGINE_INIT: 'similarityEngineInit',
  SIMILARITY_ENGINE_COMPUTE: 'similarityEngineCompute',
  SIMILARITY_ENGINE_BATCH_COMPUTE: 'similarityEngineBatchCompute',
  SIMILARITY_ENGINE_STATUS: 'similarityEngineStatus',
} as const;

// Content script message types
export const CONTENT_MESSAGE_TYPES = {
  WEB_FETCHER_GET_TEXT_CONTENT: 'webFetcherGetTextContent',
  WEB_FETCHER_GET_HTML_CONTENT: 'getHtmlContent',
  NETWORK_CAPTURE_PING: 'network_capture_ping',
  CLICK_HELPER_PING: 'click_helper_ping',
  FILL_HELPER_PING: 'fill_helper_ping',
  KEYBOARD_HELPER_PING: 'keyboard_helper_ping',
  SCREENSHOT_HELPER_PING: 'screenshot_helper_ping',
  INTERACTIVE_ELEMENTS_HELPER_PING: 'interactive_elements_helper_ping',
} as const;

// Tool action message types (for chrome.runtime.sendMessage)
export const TOOL_MESSAGE_TYPES = {
  // Screenshot related
  SCREENSHOT_PREPARE_PAGE_FOR_CAPTURE: 'preparePageForCapture',
  SCREENSHOT_GET_PAGE_DETAILS: 'getPageDetails',
  SCREENSHOT_GET_ELEMENT_DETAILS: 'getElementDetails',
  SCREENSHOT_SCROLL_PAGE: 'scrollPage',
  SCREENSHOT_RESET_PAGE_AFTER_CAPTURE: 'resetPageAfterCapture',

  // Web content fetching
  WEB_FETCHER_GET_HTML_CONTENT: 'getHtmlContent',
  WEB_FETCHER_GET_TEXT_CONTENT: 'getTextContent',

  // User interactions
  CLICK_ELEMENT: 'clickElement',
  FILL_ELEMENT: 'fillElement',
  SIMULATE_KEYBOARD: 'simulateKeyboard',

  // Interactive elements
  GET_INTERACTIVE_ELEMENTS: 'getInteractiveElements',

  // Network requests
  NETWORK_SEND_REQUEST: 'sendPureNetworkRequest',

  // Semantic similarity engine
  SIMILARITY_ENGINE_INIT: 'similarityEngineInit',
  SIMILARITY_ENGINE_COMPUTE_BATCH: 'similarityEngineComputeBatch',
} as const;

// Type unions for type safety
export type BackgroundMessageType =
  (typeof BACKGROUND_MESSAGE_TYPES)[keyof typeof BACKGROUND_MESSAGE_TYPES];
export type OffscreenMessageType =
  (typeof OFFSCREEN_MESSAGE_TYPES)[keyof typeof OFFSCREEN_MESSAGE_TYPES];
export type ContentMessageType = (typeof CONTENT_MESSAGE_TYPES)[keyof typeof CONTENT_MESSAGE_TYPES];
export type ToolMessageType = (typeof TOOL_MESSAGE_TYPES)[keyof typeof TOOL_MESSAGE_TYPES];

// Legacy enum for backward compatibility (will be deprecated)
export enum SendMessageType {
  // Screenshot related message types
  ScreenshotPreparePageForCapture = 'preparePageForCapture',
  ScreenshotGetPageDetails = 'getPageDetails',
  ScreenshotGetElementDetails = 'getElementDetails',
  ScreenshotScrollPage = 'scrollPage',
  ScreenshotResetPageAfterCapture = 'resetPageAfterCapture',

  // Web content fetching related message types
  WebFetcherGetHtmlContent = 'getHtmlContent',
  WebFetcherGetTextContent = 'getTextContent',

  // Click related message types
  ClickElement = 'clickElement',

  // Input filling related message types
  FillElement = 'fillElement',

  // Interactive elements related message types
  GetInteractiveElements = 'getInteractiveElements',

  // Network request capture related message types
  NetworkSendRequest = 'sendPureNetworkRequest',

  // Keyboard event related message types
  SimulateKeyboard = 'simulateKeyboard',

  // Semantic similarity engine related message types
  SimilarityEngineInit = 'similarityEngineInit',
  SimilarityEngineComputeBatch = 'similarityEngineComputeBatch',
}

/**
 * Tool call parameter interface
 */
export interface ToolCallParam {
  name: string;
  args: any;
}

export const createErrorResponse = (
  message: string = 'Unknown error, please try again'
): CallToolResult => {
  console.log(`[native] Creating error response: ${message}`);
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
};

/**
 * Handle tool execution
 */
export const handleCallTool = async (
  param: ToolCallParam,
  client: Client
): Promise<CallToolResult> => {
  console.log(`[native] Handling tool call: ${param.name} with args:`, param.args);
  try {
    // @ts-ignore
    const result = await client.callTool({
      name: param.name,
      arguments: param.args,
    });
    console.log(`[native] Tool call successful for ${param.name}:`, result);
    // @ts-ignore
    return result;
  } catch (error) {
    console.error(`[native] Tool execution failed for ${param.name}:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.TOOL_EXECUTION_FAILED
    );
  }
};

let nativePort: chrome.runtime.Port | null = null;
export const HOST_NAME = NATIVE_HOST.NAME;

/**
 * Server status management interface
 */
interface ServerStatus {
  isRunning: boolean;
  port?: number;
  lastUpdated: number;
}

let currentServerStatus: ServerStatus = {
  isRunning: false,
  lastUpdated: Date.now(),
};

/**
 * Save server status to chrome.storage
 */
async function saveServerStatus(status: ServerStatus): Promise<void> {
  console.log(`[native] Saving server status:`, status);
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SERVER_STATUS]: status });
    console.log(`[native] Server status saved successfully`);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_SAVE_FAILED}:`, error);
  }
}

/**
 * Load server status from chrome.storage
 */
async function loadServerStatus(): Promise<ServerStatus> {
  console.log(`[native] Loading server status from storage`);
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SERVER_STATUS]);
    if (result[STORAGE_KEYS.SERVER_STATUS]) {
      console.log(`[native] Server status loaded:`, result[STORAGE_KEYS.SERVER_STATUS]);
      return result[STORAGE_KEYS.SERVER_STATUS];
    }
    console.log(`[native] No stored server status found, using default`);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
  }
  return {
    isRunning: false,
    lastUpdated: Date.now(),
  };
}

/**
 * Broadcast server status change to all listeners
 */
function broadcastServerStatusChange(status: ServerStatus): void {
  console.log(`[native] Broadcasting server status change:`, status);
  chrome.runtime
    .sendMessage({
      type: BACKGROUND_MESSAGE_TYPES.SERVER_STATUS_CHANGED,
      payload: status,
    })
    .catch(() => {
      // Ignore errors if no listeners are present
      console.log(`[native] No listeners for server status change broadcast`);
    });
}

/**
 * Connect to the native messaging host
 */
export function connectNativeHost(port: number = NATIVE_HOST.DEFAULT_PORT, client: Client) {
  console.log(`[native] Attempting to connect to native host on port ${port}`);

  if (nativePort) {
    console.log(`[native] Native port already connected, skipping connection attempt`);
    return;
  }

  try {
    console.log(`[native] Creating native port connection to ${HOST_NAME}`);
    nativePort = chrome.runtime.connectNative(HOST_NAME);

    nativePort.onMessage.addListener(async (message) => {
      console.log(`[native] Received message from native host:`, message);

      // chrome.notifications.create({
      //   type: NOTIFICATIONS.TYPE,
      //   iconUrl: chrome.runtime.getURL(ICONS.NOTIFICATION),
      //   title: 'Message from native host',
      //   message: `Received data from host: ${JSON.stringify(message)}`,
      //   priority: NOTIFICATIONS.PRIORITY,
      // });

      if (message.type === NativeMessageType.PROCESS_DATA && message.requestId) {
        const requestId = message.requestId;
        const requestPayload = message.payload;
        console.log(
          `[native] Processing PROCESS_DATA request ${requestId} with payload:`,
          requestPayload
        );

        nativePort?.postMessage({
          responseToRequestId: requestId,
          payload: {
            status: 'success',
            message: SUCCESS_MESSAGES.TOOL_EXECUTED,
            data: requestPayload,
          },
        });
        console.log(`[native] Sent PROCESS_DATA response for request ${requestId}`);
      } else if (
        (message.type === NativeMessageType.LIST_TOOLS && message.requestId) ||
        message.type === 'request_data'
      ) {
        const requestId = message.requestId;
        client.listTools().then((tools) => {
          console.log(`[native] List tools:`, tools);
          nativePort?.postMessage({
            responseToRequestId: requestId,
            payload: {
              status: 'success',
              message: SUCCESS_MESSAGES.TOOL_EXECUTED,
              data: tools.tools,
            },
          });
        });
        console.log(`[native] Sent LIST_TOOLS response for request ${requestId}`);
      } else if (message.type === NativeMessageType.CALL_TOOL && message.requestId) {
        const requestId = message.requestId;
        console.log(
          `[native] Processing CALL_TOOL request ${requestId} with payload:`,
          message.payload
        );

        try {
          const result = await handleCallTool(message.payload, client);
          nativePort?.postMessage({
            responseToRequestId: requestId,
            payload: {
              status: 'success',
              message: SUCCESS_MESSAGES.TOOL_EXECUTED,
              data: result,
            },
          });
          console.log(`[native] Sent successful CALL_TOOL response for request ${requestId}`);
        } catch (error) {
          console.error(`[native] Error handling CALL_TOOL request ${requestId}:`, error);
          nativePort?.postMessage({
            responseToRequestId: requestId,
            payload: {
              status: 'error',
              message: ERROR_MESSAGES.TOOL_EXECUTION_FAILED,
              error: error instanceof Error ? error.message : String(error),
            },
          });
          console.log(`[native] Sent error CALL_TOOL response for request ${requestId}`);
        }
      } else if (message.type === NativeMessageType.SERVER_STARTED) {
        const port = message.payload?.port;
        console.log(`[native] Server started notification received for port ${port}`);

        currentServerStatus = {
          isRunning: true,
          port: port,
          lastUpdated: Date.now(),
        };
        await saveServerStatus(currentServerStatus);
        broadcastServerStatusChange(currentServerStatus);
        console.log(`[native] ${SUCCESS_MESSAGES.SERVER_STARTED} on port ${port}`);
      } else if (message.type === NativeMessageType.SERVER_STOPPED) {
        console.log(`[native] Server stopped notification received`);

        currentServerStatus = {
          isRunning: false,
          port: currentServerStatus.port, // Keep last known port for reconnection
          lastUpdated: Date.now(),
        };
        await saveServerStatus(currentServerStatus);
        broadcastServerStatusChange(currentServerStatus);
        console.log(`[native] ${SUCCESS_MESSAGES.SERVER_STOPPED}`);
      } else if (message.type === NativeMessageType.ERROR_FROM_NATIVE_HOST) {
        const errorMessage = message.payload?.message || 'Unknown error';
        console.error(`[native] Error from native host: ${errorMessage}`);
      } else {
        console.log(`[native] Unhandled message type: ${message.type}`);
      }
    });

    nativePort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.error(`[native] ${ERROR_MESSAGES.NATIVE_DISCONNECTED}`, lastError);
      nativePort = null;
    });

    const startMessage = { type: NativeMessageType.START, payload: { port } };
    console.log(`[native] Sending START message to native host:`, startMessage);
    nativePort.postMessage(startMessage);
    console.log(`[native] Native host connection established successfully`);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.NATIVE_CONNECTION_FAILED}:`, error);
  }
}

/**
 * Initialize native host listeners and load initial state
 */
export const initNativeHostListener = (clientTransport: InMemoryTransport) => {
  console.log(`[native] Initializing native host listener`);

  const client = new Client({
    name: 'Native',
    version: '1.0.0',
    title: 'Native',
  });
  console.log(`[native] Client created:`, client);

  client.connect(clientTransport);
  console.log(`[native] Client connected to transport`);

  // Initialize server status from storage
  loadServerStatus()
    .then((status) => {
      currentServerStatus = status;
      console.log(`[native] Server status loaded:`, currentServerStatus);
    })
    .catch((error) => {
      console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
    });

  connectNativeHost(NATIVE_HOST.DEFAULT_PORT, client);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log(`[native] Received runtime message:`, message);

    if (
      message === NativeMessageType.CONNECT_NATIVE ||
      message.type === NativeMessageType.CONNECT_NATIVE
    ) {
      const port =
        typeof message === 'object' && message.port ? message.port : NATIVE_HOST.DEFAULT_PORT;
      console.log(`[native] CONNECT_NATIVE request received for port ${port}`);

      connectNativeHost(port, client);
      sendResponse({ success: true, port });
      console.log(`[native] CONNECT_NATIVE response sent`);
      return true;
    }

    if (message.type === NativeMessageType.PING_NATIVE) {
      const connected = nativePort !== null;
      console.log(`[native] PING_NATIVE request received, connected: ${connected}`);
      sendResponse({ connected });
      return true;
    }

    if (message.type === NativeMessageType.DISCONNECT_NATIVE) {
      console.log(`[native] DISCONNECT_NATIVE request received`);

      if (nativePort) {
        nativePort.disconnect();
        nativePort = null;
        console.log(`[native] Native port disconnected successfully`);
        sendResponse({ success: true });
      } else {
        console.log(`[native] No active connection to disconnect`);
        sendResponse({ success: false, error: 'No active connection' });
      }
      return true;
    }

    if (message.type === BACKGROUND_MESSAGE_TYPES.GET_SERVER_STATUS) {
      console.log(`[native] GET_SERVER_STATUS request received`);
      const response = {
        success: true,
        serverStatus: currentServerStatus,
        connected: nativePort !== null,
      };
      console.log(`[native] GET_SERVER_STATUS response:`, response);
      sendResponse(response);
      return true;
    }

    if (message.type === BACKGROUND_MESSAGE_TYPES.REFRESH_SERVER_STATUS) {
      console.log(`[native] REFRESH_SERVER_STATUS request received`);

      loadServerStatus()
        .then((storedStatus) => {
          currentServerStatus = storedStatus;
          const response = {
            success: true,
            serverStatus: currentServerStatus,
            connected: nativePort !== null,
          };
          console.log(`[native] REFRESH_SERVER_STATUS response:`, response);
          sendResponse(response);
        })
        .catch((error) => {
          console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
          const errorResponse = {
            success: false,
            error: ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED,
            serverStatus: currentServerStatus,
            connected: nativePort !== null,
          };
          console.log(`[native] REFRESH_SERVER_STATUS error response:`, errorResponse);
          sendResponse(errorResponse);
        });
      return true;
    }

    console.log(`[native] Unhandled runtime message type:`, message.type || 'unknown');
  });

  console.log(`[native] Native host listener initialization complete`);
};
