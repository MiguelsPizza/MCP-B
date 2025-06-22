import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ProxyApiToolsOptions {
  getProxySettings?: boolean;
  setProxySettings?: boolean;
  clearProxySettings?: boolean;
}

export class ProxyApiTools extends BaseApiTools {
  protected apiName = 'Proxy';

  constructor(
    server: McpServer,
    options: ProxyApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.proxy) {
        return {
          available: false,
          message: 'chrome.proxy API is not defined',
          details: 'This extension needs the "proxy" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (!chrome.proxy.settings || typeof chrome.proxy.settings.get !== 'function') {
        return {
          available: false,
          message: 'chrome.proxy.settings.get is not available',
          details: 'The proxy API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.proxy.settings.get({ incognito: false }, (_config) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Proxy API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.proxy API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getProxySettings')) {
      this.registerGetProxySettings();
    }

    if (this.shouldRegisterTool('setProxySettings')) {
      this.registerSetProxySettings();
    }

    if (this.shouldRegisterTool('clearProxySettings')) {
      this.registerClearProxySettings();
    }
  }

  private registerGetProxySettings(): void {
    this.server.registerTool(
      'get_proxy_settings',
      {
        description: 'Get the current proxy configuration settings',
        inputSchema: {
          incognito: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether to get proxy settings for incognito mode'),
        },
      },
      async ({ incognito }) => {
        try {
          const config = await new Promise<any>((resolve, reject) => {
            chrome.proxy.settings.get({ incognito }, (config) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(config);
              }
            });
          });

          return this.formatJson({
            levelOfControl: config.levelOfControl,
            value: config.value,
            incognitoSpecific: config.incognitoSpecific,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetProxySettings(): void {
    this.server.registerTool(
      'set_proxy_settings',
      {
        description: 'Set proxy configuration settings',
        inputSchema: {
          mode: z
            .enum(['direct', 'auto_detect', 'pac_script', 'fixed_servers', 'system'])
            .describe('Proxy mode to use'),
          scope: z
            .enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'])
            .optional()
            .default('regular')
            .describe('Scope of the setting'),
          pacScriptUrl: z
            .string()
            .optional()
            .describe('URL of the PAC file (for pac_script mode)'),
          pacScriptData: z
            .string()
            .optional()
            .describe('PAC script content (for pac_script mode)'),
          pacScriptMandatory: z
            .boolean()
            .optional()
            .describe('Whether PAC script is mandatory'),
          singleProxyHost: z
            .string()
            .optional()
            .describe('Host for single proxy (for fixed_servers mode)'),
          singleProxyPort: z
            .number()
            .optional()
            .describe('Port for single proxy (for fixed_servers mode)'),
          singleProxyScheme: z
            .enum(['http', 'https', 'quic', 'socks4', 'socks5'])
            .optional()
            .describe('Scheme for single proxy (for fixed_servers mode)'),
          httpProxyHost: z
            .string()
            .optional()
            .describe('Host for HTTP proxy (for fixed_servers mode)'),
          httpProxyPort: z
            .number()
            .optional()
            .describe('Port for HTTP proxy (for fixed_servers mode)'),
          httpProxyScheme: z
            .enum(['http', 'https', 'quic', 'socks4', 'socks5'])
            .optional()
            .describe('Scheme for HTTP proxy (for fixed_servers mode)'),
          httpsProxyHost: z
            .string()
            .optional()
            .describe('Host for HTTPS proxy (for fixed_servers mode)'),
          httpsProxyPort: z
            .number()
            .optional()
            .describe('Port for HTTPS proxy (for fixed_servers mode)'),
          httpsProxyScheme: z
            .enum(['http', 'https', 'quic', 'socks4', 'socks5'])
            .optional()
            .describe('Scheme for HTTPS proxy (for fixed_servers mode)'),
          ftpProxyHost: z
            .string()
            .optional()
            .describe('Host for FTP proxy (for fixed_servers mode)'),
          ftpProxyPort: z
            .number()
            .optional()
            .describe('Port for FTP proxy (for fixed_servers mode)'),
          ftpProxyScheme: z
            .enum(['http', 'https', 'quic', 'socks4', 'socks5'])
            .optional()
            .describe('Scheme for FTP proxy (for fixed_servers mode)'),
          fallbackProxyHost: z
            .string()
            .optional()
            .describe('Host for fallback proxy (for fixed_servers mode)'),
          fallbackProxyPort: z
            .number()
            .optional()
            .describe('Port for fallback proxy (for fixed_servers mode)'),
          fallbackProxyScheme: z
            .enum(['http', 'https', 'quic', 'socks4', 'socks5'])
            .optional()
            .describe('Scheme for fallback proxy (for fixed_servers mode)'),
          bypassList: z
            .array(z.string())
            .optional()
            .describe('List of servers to bypass proxy (for fixed_servers mode)'),
        },
      },
      async ({
        mode,
        scope,
        pacScriptUrl,
        pacScriptData,
        pacScriptMandatory,
        singleProxyHost,
        singleProxyPort,
        singleProxyScheme,
        httpProxyHost,
        httpProxyPort,
        httpProxyScheme,
        httpsProxyHost,
        httpsProxyPort,
        httpsProxyScheme,
        ftpProxyHost,
        ftpProxyPort,
        ftpProxyScheme,
        fallbackProxyHost,
        fallbackProxyPort,
        fallbackProxyScheme,
        bypassList,
      }) => {
        try {
          const config: any = { mode };

          if (mode === 'pac_script') {
            const pacScript: any = {};
            if (pacScriptUrl !== undefined) pacScript.url = pacScriptUrl;
            if (pacScriptData !== undefined) pacScript.data = pacScriptData;
            if (pacScriptMandatory !== undefined) pacScript.mandatory = pacScriptMandatory;
            
            if (Object.keys(pacScript).length === 0) {
              return this.formatError('PAC script URL or data must be provided for pac_script mode');
            }
            
            config.pacScript = pacScript;
          } else if (mode === 'fixed_servers') {
            const rules: any = {};

            if (singleProxyHost) {
              const singleProxy: any = { host: singleProxyHost };
              if (singleProxyPort !== undefined) singleProxy.port = singleProxyPort;
              if (singleProxyScheme !== undefined) singleProxy.scheme = singleProxyScheme;
              rules.singleProxy = singleProxy;
            } else {
              if (httpProxyHost) {
                const httpProxy: any = { host: httpProxyHost };
                if (httpProxyPort !== undefined) httpProxy.port = httpProxyPort;
                if (httpProxyScheme !== undefined) httpProxy.scheme = httpProxyScheme;
                rules.proxyForHttp = httpProxy;
              }

              if (httpsProxyHost) {
                const httpsProxy: any = { host: httpsProxyHost };
                if (httpsProxyPort !== undefined) httpsProxy.port = httpsProxyPort;
                if (httpsProxyScheme !== undefined) httpsProxy.scheme = httpsProxyScheme;
                rules.proxyForHttps = httpsProxy;
              }

              if (ftpProxyHost) {
                const ftpProxy: any = { host: ftpProxyHost };
                if (ftpProxyPort !== undefined) ftpProxy.port = ftpProxyPort;
                if (ftpProxyScheme !== undefined) ftpProxy.scheme = ftpProxyScheme;
                rules.proxyForFtp = ftpProxy;
              }

              if (fallbackProxyHost) {
                const fallbackProxy: any = { host: fallbackProxyHost };
                if (fallbackProxyPort !== undefined) fallbackProxy.port = fallbackProxyPort;
                if (fallbackProxyScheme !== undefined) fallbackProxy.scheme = fallbackProxyScheme;
                rules.fallbackProxy = fallbackProxy;
              }
            }

            if (bypassList !== undefined) {
              rules.bypassList = bypassList;
            }

            if (Object.keys(rules).length === 0) {
              return this.formatError('At least one proxy server must be specified for fixed_servers mode');
            }

            config.rules = rules;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.proxy.settings.set({ value: config, scope }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Proxy settings updated successfully', {
            mode,
            scope,
            config,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearProxySettings(): void {
    this.server.registerTool(
      'clear_proxy_settings',
      {
        description: 'Clear proxy settings and revert to default',
        inputSchema: {
          scope: z
            .enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'])
            .optional()
            .default('regular')
            .describe('Scope of the setting to clear'),
        },
      },
      async ({ scope }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.proxy.settings.clear({ scope }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Proxy settings cleared successfully', { scope });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}