import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

// Constants
export const DEFAULT_SERVER_PORT = 56889;
export const HOST_NAME = 'com.chromemcp.nativehost';

export enum NativeMessageType {
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
  LIST_TOOLS = 'list_tools',
  LIST_TOOLS_RESPONSE = 'list_tools_response',
  TOOLS_CHANGED = 'tools_changed',
  SERVER_STARTED = 'server_started',
  SERVER_STOPPED = 'server_stopped',
  ERROR_FROM_NATIVE_HOST = 'error_from_native_host',
  CONNECT_NATIVE = 'connectNative',
  PING_NATIVE = 'ping_native',
  DISCONNECT_NATIVE = 'disconnect_native',
}

export interface NativeMessage<P = any, E = any> {
  type?: NativeMessageType;
  responseToRequestId?: string;
  requestId?: string;
  payload?: P;
  error?: E;
}

export interface ServerStatus {
  isRunning: boolean;
  port?: number;
  lastUpdated: number;
}

export interface NativeHostManagerConfig {
  defaultPort?: number;
  storageKey?: string;
}

export class NativeHostManager {
  private nativePort: chrome.runtime.Port | null = null;
  private mcpClient: Client;
  private currentServerStatus: ServerStatus;
  private readonly defaultPort: number;
  private readonly storageKey: string;

  constructor(mcpClient: Client, config: NativeHostManagerConfig = {}) {
    this.mcpClient = mcpClient;
    this.defaultPort = config.defaultPort || DEFAULT_SERVER_PORT;
    this.storageKey = config.storageKey || 'serverStatus';
    this.currentServerStatus = {
      isRunning: false,
      lastUpdated: Date.now(),
    };
  }

  async initialize(): Promise<void> {
    this.connect();
    await this.loadServerStatus();
    this.setupListeners();
    chrome.runtime.onStartup.addListener(() => this.connect());
  }

  private setupListeners(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('message', message);
      // if (
      //   message === NativeMessageType.CONNECT_NATIVE ||
      //   message.type === NativeMessageType.CONNECT_NATIVE
      // ) {
      //   const port = typeof message === 'object' && message.port ? message.port : this.defaultPort;
      //   sendResponse({ success: true, port });
      //   return true;
      // }

      if (message.type === NativeMessageType.PING_NATIVE) {
        sendResponse({ connected: this.isConnected() });
        return true;
      }

      if (message.type === NativeMessageType.DISCONNECT_NATIVE) {
        if (this.nativePort) {
          this.disconnect();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No active connection' });
        }
        return true;
      }

      if (message.type === 'get_server_status') {
        sendResponse({
          success: true,
          serverStatus: this.currentServerStatus,
          connected: this.isConnected(),
        });
        return true;
      }

      if (message.type === 'refresh_server_status') {
        this.loadServerStatus()
          .then(() => {
            sendResponse({
              success: true,
              serverStatus: this.currentServerStatus,
              connected: this.isConnected(),
            });
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: 'Failed to load server status',
              serverStatus: this.currentServerStatus,
              connected: this.isConnected(),
            });
          });
        return true;
      }
    });
  }

  connect(port: number = this.defaultPort): void {
    if (this.nativePort) {
      return;
    }

    try {
      console.log('connect', port, HOST_NAME);
      console.log('Extension ID:', chrome.runtime.id);
      this.nativePort = chrome.runtime.connectNative(HOST_NAME);
      console.log('nativePort', this.nativePort);
      this.setupNativePortListeners();

      // Send a test message immediately after connecting
      console.log('Sending START message to native host');
      this.nativePort.postMessage({ type: NativeMessageType.START, payload: { port } });
    } catch (error) {
      console.error('Failed to connect to native host', error);
    }
  }

  private setupNativePortListeners(): void {
    if (!this.nativePort) return;

    this.nativePort.onMessage.addListener(async (message: NativeMessage) => {
      console.log('Received message from native host:', message);
      switch (message.type) {
        case NativeMessageType.PROCESS_DATA:
          await this.handleProcessData(message);
          break;
        case NativeMessageType.CALL_TOOL:
          await this.handleCallTool(message);
          break;
        case 'list_tools':
          await this.handleListTools(message);
          break;
        case NativeMessageType.SERVER_STARTED:
          await this.handleServerStarted(message);
          break;
        case NativeMessageType.SERVER_STOPPED:
          await this.handleServerStopped();
          break;
        case NativeMessageType.ERROR_FROM_NATIVE_HOST:
          this.handleError(message);
          break;
        default:
          console.warn('Unhandled message type from native host:', message.type, message);
          break;
      }
    });

    this.nativePort.onDisconnect.addListener(() => {
      console.error(
        'Native connection disconnected',
        JSON.stringify(chrome.runtime.lastError, null, 2)
      );
      this.nativePort = null;
    });
  }

  private async handleProcessData(message: NativeMessage): Promise<void> {
    if (!message.requestId || !this.nativePort) return;

    this.nativePort.postMessage({
      responseToRequestId: message.requestId,
      payload: {
        status: 'success',
        message: 'Tool executed successfully',
        data: message.payload,
      },
    });
  }

  private async handleCallTool(message: NativeMessage): Promise<void> {
    if (!message.requestId || !message.payload || !this.nativePort) return;

    try {
      const { name, args } = message.payload;

      // Use the MCP client to call the tool
      const result = await this.mcpClient.callTool({
        name: name,
        arguments: args || {},
      });

      this.nativePort.postMessage({
        responseToRequestId: message.requestId,
        payload: {
          status: 'success',
          message: 'Tool executed successfully',
          data: result,
        },
      });
    } catch (error) {
      this.nativePort.postMessage({
        responseToRequestId: message.requestId,
        payload: {
          status: 'error',
          message: 'Tool execution failed',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private async handleListTools(message: NativeMessage): Promise<void> {
    console.log('handleListTools', message);
    if (!message.requestId || !this.nativePort) {
      console.error('Missing requestId or nativePort', {
        requestId: message.requestId,
        hasPort: !!this.nativePort,
      });
      return;
    }

    try {
      // Use the MCP client to list available tools
      const result = await this.mcpClient.listTools();
      console.log('result', result);
      const response = {
        responseToRequestId: message.requestId,
        payload: {
          status: 'success',
          tools: result.tools,
        },
      };
      console.log('Sending response back to native host:', response);
      this.nativePort.postMessage(response);
    } catch (error) {
      this.nativePort.postMessage({
        responseToRequestId: message.requestId,
        payload: {
          status: 'error',
          message: 'Failed to list tools',
          error: error instanceof Error ? error.message : String(error),
          tools: [],
        },
      });
    }
  }

  private async handleServerStarted(message: NativeMessage): Promise<void> {
    const port = message.payload?.port;
    this.currentServerStatus = {
      isRunning: true,
      port: port,
      lastUpdated: Date.now(),
    };
    await this.saveServerStatus();
    this.broadcastServerStatusChange();
    console.log(`Server started successfully on port ${port}`);
  }

  private async handleServerStopped(): Promise<void> {
    this.currentServerStatus = {
      isRunning: false,
      port: this.currentServerStatus.port,
      lastUpdated: Date.now(),
    };
    await this.saveServerStatus();
    this.broadcastServerStatusChange();
    console.log('Server stopped successfully');
  }

  private handleError(message: NativeMessage): void {
    console.error('Error from native host:', message.payload?.message || 'Unknown error');
  }

  disconnect(): void {
    if (this.nativePort) {
      this.nativePort.disconnect();
      this.nativePort = null;
    }
  }

  isConnected(): boolean {
    return this.nativePort !== null;
  }

  getServerStatus(): ServerStatus {
    return this.currentServerStatus;
  }

  private async saveServerStatus(): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.storageKey]: this.currentServerStatus });
    } catch (error) {
      console.error('Failed to save server status', error);
    }
  }

  private async loadServerStatus(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      if (result[this.storageKey]) {
        this.currentServerStatus = result[this.storageKey];
      }
    } catch (error) {
      console.error('Failed to load server status', error);
    }
  }

  private broadcastServerStatusChange(): void {
    chrome.runtime
      .sendMessage({
        type: 'server_status_changed',
        payload: this.currentServerStatus,
      })
      .catch(() => {
        // Ignore errors if no listeners are present
      });
  }

  notifyToolsChanged(): void {
    if (this.nativePort) {
      this.nativePort.postMessage({
        type: NativeMessageType.TOOLS_CHANGED,
      });
    }
  }
}

// Export for backward compatibility
export const initNativeHostListener = (mcpClient: Client) => {
  const manager = new NativeHostManager(mcpClient);
  return manager.initialize();
};
