import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface VpnProviderApiToolsOptions {
  createConfig?: boolean;
  destroyConfig?: boolean;
  setParameters?: boolean;
  notifyConnectionStateChanged?: boolean;
  sendPacket?: boolean;
}

export class VpnProviderApiTools extends BaseApiTools {
  protected apiName = 'VpnProvider';

  constructor(server: McpServer, options: VpnProviderApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.vpnProvider) {
        return {
          available: false,
          message: 'chrome.vpnProvider API is not defined',
          details:
            'This extension needs the "vpnProvider" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.vpnProvider.createConfig !== 'function') {
        return {
          available: false,
          message: 'chrome.vpnProvider.createConfig is not available',
          details:
            'The vpnProvider API appears to be partially available. Check manifest permissions and ensure this is running on ChromeOS.',
        };
      }

      return {
        available: true,
        message: 'VpnProvider API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.vpnProvider API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('createConfig')) {
      this.registerCreateConfig();
    }

    if (this.shouldRegisterTool('destroyConfig')) {
      this.registerDestroyConfig();
    }

    if (this.shouldRegisterTool('setParameters')) {
      this.registerSetParameters();
    }

    if (this.shouldRegisterTool('notifyConnectionStateChanged')) {
      this.registerNotifyConnectionStateChanged();
    }

    if (this.shouldRegisterTool('sendPacket')) {
      this.registerSendPacket();
    }
  }

  private registerCreateConfig(): void {
    this.server.registerTool(
      'create_vpn_config',
      {
        description: 'Create a new VPN configuration that persists across multiple login sessions',
        inputSchema: {
          name: z.string().describe('The name of the VPN configuration'),
        },
      },
      async ({ name }) => {
        try {
          const configId = await new Promise<string>((resolve, reject) => {
            chrome.vpnProvider.createConfig(name, (id) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (!id) {
                reject(new Error('Failed to create VPN configuration'));
              } else {
                resolve(id);
              }
            });
          });

          return this.formatSuccess('VPN configuration created successfully', {
            id: configId,
            name: name,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDestroyConfig(): void {
    this.server.registerTool(
      'destroy_vpn_config',
      {
        description: 'Destroy a VPN configuration created by the extension',
        inputSchema: {
          id: z.string().describe('ID of the VPN configuration to destroy'),
        },
      },
      async ({ id }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.vpnProvider.destroyConfig(id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('VPN configuration destroyed successfully', {
            id: id,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetParameters(): void {
    this.server.registerTool(
      'set_vpn_parameters',
      {
        description:
          'Set the parameters for the VPN session. Should be called immediately after "connected" is received',
        inputSchema: {
          address: z
            .string()
            .describe(
              'IP address for the VPN interface in CIDR notation. IPv4 is currently the only supported mode'
            ),
          dnsServer: z.array(z.string()).describe('A list of IPs for the DNS servers'),
          inclusionList: z
            .array(z.string())
            .describe(
              'Include network traffic to the list of IP blocks in CIDR notation to the tunnel'
            ),
          exclusionList: z
            .array(z.string())
            .describe(
              'Exclude network traffic to the list of IP blocks in CIDR notation from the tunnel'
            ),
          broadcastAddress: z
            .string()
            .optional()
            .describe(
              'Broadcast address for the VPN interface (default: deduced from IP address and mask)'
            ),
          domainSearch: z
            .array(z.string())
            .optional()
            .describe('A list of search domains (default: no search domain)'),
          mtu: z
            .string()
            .optional()
            .describe('MTU setting for the VPN interface (default: 1500 bytes)'),
        },
      },
      async ({
        address,
        dnsServer,
        inclusionList,
        exclusionList,
        broadcastAddress,
        domainSearch,
        mtu,
      }) => {
        try {
          const parameters: chrome.vpnProvider.VpnSessionParameters = {
            address,
            dnsServer,
            inclusionList,
            exclusionList,
          };

          if (broadcastAddress !== undefined) {
            parameters.broadcastAddress = broadcastAddress;
          }

          if (domainSearch !== undefined) {
            parameters.domainSearch = domainSearch;
          }

          if (mtu !== undefined) {
            parameters.mtu = mtu;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.vpnProvider.setParameters(parameters, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('VPN parameters set successfully', {
            parameters: parameters,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerNotifyConnectionStateChanged(): void {
    this.server.registerTool(
      'notify_vpn_connection_state',
      {
        description:
          'Notify the VPN session state to the platform. This will succeed only when the VPN session is owned by the extension',
        inputSchema: {
          state: z
            .enum(['connected', 'failure'])
            .describe('The VPN session state of the VPN client'),
        },
      },
      async ({ state }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.vpnProvider.notifyConnectionStateChanged(state, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('VPN connection state notified successfully', {
            state: state,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSendPacket(): void {
    this.server.registerTool(
      'send_vpn_packet',
      {
        description:
          'Send an IP packet through the tunnel created for the VPN session. This will succeed only when the VPN session is owned by the extension',
        inputSchema: {
          data: z.string().describe('The IP packet data as a base64 encoded string'),
        },
      },
      async ({ data }) => {
        try {
          // Convert base64 string to ArrayBuffer
          const binaryString = atob(data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const arrayBuffer = bytes.buffer;

          await new Promise<void>((resolve, reject) => {
            chrome.vpnProvider.sendPacket(arrayBuffer, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('VPN packet sent successfully', {
            packetSize: arrayBuffer.byteLength,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
