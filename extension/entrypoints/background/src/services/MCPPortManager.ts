// `import { ChromeTabTransport, MCPHub } from '@mcp-b/protocol';
// `import { ExtensionServerTransport } from '@mcp-b/transports';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { ExtensionToolsService } from './ExtensionToolsService';

// /**
//  * Represents information about a connected MCP port
//  */
// export interface PortInfo {
//   /** The Chrome runtime port instance */
//   port: chrome.runtime.Port;
//   /** The MCP server instance associated with this port */
//   server: McpServer;
//   /** Optional MCP hub instance (only for local ports) */
//   hub?: MCPHub;
//   /** Transport layer for server-port communication */
//   transport: ExtensionServerTransport;
//   /** Timestamp when the port was connected */
//   connectedAt: Date;
//   /** Additional metadata about the port */
//   metadata?: {
//     tabId?: number;
//     extensionId?: string;
//     url?: string;
//   };
// }

// /**
//  * Type of MCP port connection
//  * - 'native': Native host connections
//  * - 'external': Connections from other extensions
//  * - 'local': Connections from within this extension
//  */
// export type PortType = 'native' | 'external' | 'local';

// /**
//  * Grouped collection of ports by type
//  */
// export interface PortGroup {
//   native: Map<string, PortInfo>;
//   external: Map<string, PortInfo>;
//   local: Map<string, PortInfo>;
// }

// /**
//  * Configuration options for MCPPortManager
//  */
// export interface MCPPortManagerConfig {
//   /** Maximum number of ports allowed per type */
//   maxPortsPerType?: number;
//   /** Whether to auto-reconnect disconnected ports */
//   autoReconnect?: boolean;
//   /** Custom port name patterns to accept */
//   customPortPatterns?: RegExp[];
//   /** Callback for port connection events */
//   onPortConnect?: (portId: string, type: PortType, info: PortInfo) => void;
//   /** Callback for port disconnection events */
//   onPortDisconnect?: (portId: string, type: PortType) => void;
// }

// /**
//  * Port classification functions
//  */
// interface PortClassifiers {
//   isNative: (port: chrome.runtime.Port) => boolean;
//   isExternal: (port: chrome.runtime.Port) => boolean;
//   isLocal: (port: chrome.runtime.Port) => boolean;
// }

// /**
//  * Manages MCP (Model Context Protocol) port connections in the Chrome extension.
//  *
//  * This class handles:
//  * - Port lifecycle management (connection, disconnection)
//  * - Port type classification (native, external, local)
//  * - MCP server creation and management for each port
//  * - Hub creation for local ports
//  * - Extension tools registration
//  *
//  * @example
//  * ```typescript
//  * const portManager = new MCPPortManager({
//  *   maxPortsPerType: 10,
//  *   onPortConnect: (portId, type) => {
//  *     console.log(`Port ${portId} of type ${type} connected`);
//  *   }
//  * });
//  *
//  * // Get all connected ports
//  * const allPorts = portManager.getConnectedPorts();
//  *
//  * // Get specific port type
//  * const nativePorts = portManager.getConnectedPorts('native');
//  * ```
//  */
// export class MCPPortManager {
//   private readonly ports: PortGroup = {
//     native: new Map(),
//     external: new Map(),
//     local: new Map(),
//   };

//   private readonly config: Required<MCPPortManagerConfig>;

//   private readonly portTypeClassifiers: PortClassifiers = {
//     /**
//      * Checks if a port is a native host connection
//      */
//     isNative: (port: chrome.runtime.Port): boolean => {
//       return port.name === 'mcp-native' || port.name.startsWith('native-');
//     },

//     /**
//      * Checks if a port is from an external extension
//      */
//     isExternal: (port: chrome.runtime.Port): boolean => {
//       return port.sender?.id !== undefined && port.sender.id !== chrome.runtime.id;
//     },

//     /**
//      * Checks if a port is from within this extension
//      */
//     isLocal: (port: chrome.runtime.Port): boolean => {
//       return port.sender?.id === chrome.runtime.id || !port.sender;
//     },
//   };

//   /**
//    * Default MCP port name patterns
//    */
//   private readonly defaultPortPatterns: RegExp[] = [/^mcp/, /mcp/i];

//   /**
//    * Creates a new MCPPortManager instance
//    * @param config - Configuration options
//    */
//   constructor(config: MCPPortManagerConfig = {}) {
//     this.config = {
//       maxPortsPerType: config.maxPortsPerType ?? 100,
//       autoReconnect: config.autoReconnect ?? false,
//       customPortPatterns: config.customPortPatterns ?? [],
//       onPortConnect: config.onPortConnect ?? (() => {}),
//       onPortDisconnect: config.onPortDisconnect ?? (() => {}),
//     };

//     this.setupPortListener();
//   }

//   /**
//    * Sets up the Chrome runtime port connection listener
//    */
//   private setupPortListener(): void {
//     chrome.runtime.onConnect.addListener((port) => {
//       if (this.isMCPPort(port)) {
//         this.handleNewPort(port).catch((error) => {
//           console.error('[MCPPortManager] Error handling new port:', error);
//         });
//       }
//     });
//   }

//   /**
//    * Checks if a port should be handled as an MCP port
//    * @param port - The Chrome runtime port to check
//    * @returns True if the port matches MCP patterns
//    */
//   private isMCPPort(port: chrome.runtime.Port): boolean {
//     const patterns = [...this.defaultPortPatterns, ...this.config.customPortPatterns];
//     return patterns.some((pattern) => pattern.test(port.name));
//   }

//   /**
//    * Determines the type of a given port
//    * @param port - The Chrome runtime port to classify
//    * @returns The port type
//    */
//   private getPortType(port: chrome.runtime.Port): PortType {
//     if (this.portTypeClassifiers.isNative(port)) {
//       return 'native';
//     }
//     if (this.portTypeClassifiers.isExternal(port)) {
//       return 'external';
//     }
//     return 'local';
//   }

//   /**
//    * Generates a unique identifier for a port
//    * @param port - The Chrome runtime port
//    * @param type - The port type
//    * @returns A unique port identifier
//    */
//   private getPortId(port: chrome.runtime.Port, type: PortType): string {
//     const timestamp = Date.now();
//     const baseId = port.sender?.tab?.id?.toString() || port.sender?.id || 'unknown';
//     return `${type}_${baseId}_${port.name}_${timestamp}`;
//   }

//   /**
//    * Gets the prefixed name for a port type
//    * @param type - The port type
//    * @returns The prefixed name
//    */
//   private getPrefixedName(type: PortType): string {
//     const prefixes: Record<PortType, string> = {
//       native: 'mcp-native',
//       external: 'mcp-external',
//       local: 'mcp-local',
//     };
//     return prefixes[type];
//   }

//   /**
//    * Extracts metadata from a port
//    * @param port - The Chrome runtime port
//    * @returns Port metadata
//    */
//   private extractPortMetadata(port: chrome.runtime.Port): PortInfo['metadata'] {
//     return {
//       tabId: port.sender?.tab?.id,
//       extensionId: port.sender?.id,
//       url: port.sender?.url,
//     };
//   }

//   /**
//    * Handles a new port connection
//    * @param port - The newly connected Chrome runtime port
//    * @throws Error if port setup fails
//    */
//   private async handleNewPort(port: chrome.runtime.Port): Promise<void> {
//     const type = this.getPortType(port);
//     const portId = this.getPortId(port, type);
//     const portGroup = this.ports[type];

//     // Check port limit
//     if (portGroup.size >= this.config.maxPortsPerType) {
//       console.warn(`[MCPPortManager] Port limit reached for type ${type}`);
//       port.disconnect();
//       return;
//     }

//     // Check if port already exists (shouldn't happen with timestamp in ID)
//     if (portGroup.has(portId)) {
//       console.warn(`[MCPPortManager] Port ${portId} already connected, ignoring`);
//       return;
//     }

//     try {
//       // Create MCP server
//       const server = new McpServer({
//         name: `${this.getPrefixedName(type)}-hub`,
//         version: '1.0.0',
//       });

//       // Register extension tools
//       const extensionTools = new ExtensionToolsService(server, {});
//       extensionTools.registerAllTools();

//       // Create transport
//       const transport = new ExtensionServerTransport(port);

//       // Create hub for local ports
//       let hub: MCPHub | undefined;
//       if (type === 'local') {
//         const tabTransport = new ChromeTabTransport();
//         hub = new MCPHub(server, tabTransport);
//       }

//       // Connect server to transport
//       await server.connect(transport);

//       // Store port info
//       const portInfo: PortInfo = {
//         port,
//         server,
//         hub,
//         transport,
//         connectedAt: new Date(),
//         metadata: this.extractPortMetadata(port),
//       };

//       portGroup.set(portId, portInfo);

//       // Setup disconnect handler
//       port.onDisconnect.addListener(() => {
//         this.handlePortDisconnect(portId, type);
//       });

//       console.log(`[MCPPortManager] Connected ${type} port: ${portId}`);

//       // Trigger callback
//       this.config.onPortConnect(portId, type, portInfo);
//     } catch (error) {
//       console.error(`[MCPPortManager] Failed to setup port ${portId}:`, error);
//       port.disconnect();
//       throw error;
//     }
//   }

//   /**
//    * Handles port disconnection
//    * @param portId - The ID of the disconnected port
//    * @param type - The type of the disconnected port
//    */
//   private handlePortDisconnect(portId: string, type: PortType): void {
//     const portGroup = this.ports[type];
//     const portInfo = portGroup.get(portId);

//     if (portInfo) {
//       try {
//         // Cleanup hub if present
//         if (portInfo.hub) {
//           // Hub cleanup logic here if needed
//         }

//         // Close server
//         portInfo.server.close();

//         // Remove from registry
//         portGroup.delete(portId);

//         console.log(`[MCPPortManager] Disconnected ${type} port: ${portId}`);

//         // Trigger callback
//         this.config.onPortDisconnect(portId, type);
//       } catch (error) {
//         console.error(`[MCPPortManager] Error during port cleanup for ${portId}:`, error);
//       }
//     }
//   }

//   // Public API

//   /**
//    * Gets connected ports, optionally filtered by type
//    * @param type - Optional port type to filter by
//    * @returns Map of port IDs to port info, or all port groups
//    */
//   public getConnectedPorts(type?: PortType): Map<string, PortInfo> | PortGroup {
//     if (type) {
//       return new Map(this.ports[type]);
//     }
//     return {
//       native: new Map(this.ports.native),
//       external: new Map(this.ports.external),
//       local: new Map(this.ports.local),
//     };
//   }

//   /**
//    * Gets the count of connected ports
//    * @param type - Optional port type to count
//    * @returns Number of connected ports
//    */
//   public getPortCount(type?: PortType): number {
//     if (type) {
//       return this.ports[type].size;
//     }
//     return this.ports.native.size + this.ports.external.size + this.ports.local.size;
//   }

//   /**
//    * Checks if a specific port is connected
//    * @param portId - The port ID to check
//    * @param type - The port type
//    * @returns True if the port is connected
//    */
//   public isPortConnected(portId: string, type: PortType): boolean {
//     return this.ports[type].has(portId);
//   }

//   /**
//    * Gets all port IDs grouped by type
//    * @returns Object with arrays of port IDs by type
//    */
//   public getAllPortIds(): Record<PortType, string[]> {
//     return {
//       native: Array.from(this.ports.native.keys()),
//       external: Array.from(this.ports.external.keys()),
//       local: Array.from(this.ports.local.keys()),
//     };
//   }

//   /**
//    * Gets detailed information about a specific port
//    * @param portId - The port ID
//    * @param type - The port type
//    * @returns Port information or undefined if not found
//    */
//   public getPortInfo(portId: string, type: PortType): PortInfo | undefined {
//     return this.ports[type].get(portId);
//   }

//   /**
//    * Disconnects a specific port
//    * @param portId - The port ID to disconnect
//    * @param type - The port type
//    * @returns Promise that resolves when disconnection is complete
//    */
//   public async disconnectPort(portId: string, type: PortType): Promise<void> {
//     const portInfo = this.ports[type].get(portId);
//     if (portInfo) {
//       portInfo.port.disconnect();
//       // The cleanup will be handled by the disconnect listener
//     } else {
//       throw new Error(`Port ${portId} of type ${type} not found`);
//     }
//   }

//   /**
//    * Disconnects all ports, optionally filtered by type
//    * @param type - Optional port type to disconnect
//    * @returns Promise that resolves when all disconnections are complete
//    */
//   public async disconnectAllPorts(type?: PortType): Promise<void> {
//     const types: PortType[] = type ? [type] : ['native', 'external', 'local'];

//     const disconnectPromises: Promise<void>[] = [];

//     for (const t of types) {
//       const portGroup = this.ports[t];
//       for (const [portId] of portGroup) {
//         disconnectPromises.push(
//           this.disconnectPort(portId, t).catch((error) => {
//             console.error(`[MCPPortManager] Error disconnecting port ${portId}:`, error);
//           })
//         );
//       }
//     }

//     await Promise.all(disconnectPromises);
//   }

//   /**
//    * Gets statistics about connected ports
//    * @returns Port statistics
//    */
//   public getStatistics(): {
//     totalPorts: number;
//     portsByType: Record<PortType, number>;
//     oldestConnection: Date | null;
//     newestConnection: Date | null;
//   } {
//     let oldestConnection: Date | null = null;
//     let newestConnection: Date | null = null;

//     const allPorts = [
//       ...this.ports.native.values(),
//       ...this.ports.external.values(),
//       ...this.ports.local.values(),
//     ];

//     for (const portInfo of allPorts) {
//       if (!oldestConnection || portInfo.connectedAt < oldestConnection) {
//         oldestConnection = portInfo.connectedAt;
//       }
//       if (!newestConnection || portInfo.connectedAt > newestConnection) {
//         newestConnection = portInfo.connectedAt;
//       }
//     }

//     return {
//       totalPorts: this.getPortCount(),
//       portsByType: {
//         native: this.ports.native.size,
//         external: this.ports.external.size,
//         local: this.ports.local.size,
//       },
//       oldestConnection,
//       newestConnection,
//     };
//   }
// }
