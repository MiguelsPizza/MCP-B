#!/usr/bin/env node
import { ChildProcess, spawn } from 'child_process';
import { createConnection } from 'net';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Track child processes for cleanup
const childProcesses: ChildProcess[] = [];

// Helper to check if port is available
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const client = createConnection({ port }, () => {
      client.end();
      resolve(false); // Port is in use
    });

    client.on('error', () => {
      resolve(true); // Port is available
    });
  });
}

program
  .name('mcp-websocket-bridge')
  .description('WebSocket bridge for connecting MCP clients to browser extensions')
  .version('0.1.8');

program
  .command('start', { isDefault: true })
  .description('Start the WebSocket bridge server')
  .option('-p, --port <port>', 'Port to run the bridge on', '8021')
  .option('--with-inspector', 'Also start MCP Inspector connected to the bridge')
  .action(async (options) => {
    const port = parseInt(options.port);

    // Check if port is available
    const isAvailable = await checkPort(port);
    if (!isAvailable) {
      console.error(`Error: Port ${port} is already in use.`);
      console.error('Please choose a different port using the --port option.');
      process.exit(1);
    }

    console.log(`Starting MCP WebSocket Bridge on port ${port}...`);
    console.log('');
    console.log('Connection URLs:');
    console.log(`  Extensions: ws://localhost:${port}?type=extension`);
    console.log(`  MCP Clients: ws://localhost:${port}`);
    console.log('');

    // Start the bridge server
    const bridgeProcess = spawn('node', [join(__dirname, 'bridge-server.js')], {
      stdio: 'inherit',
      env: { ...process.env, PORT: port.toString() },
    });
    childProcesses.push(bridgeProcess);

    if (options.withInspector) {
      // Give the bridge a moment to start
      setTimeout(() => {
        console.log('');
        console.log('Starting MCP Inspector...');

        // Start the proxy connected to the bridge
        const inspectorProcess = spawn(
          'npx',
          [
            '@modelcontextprotocol/inspector',
            'node',
            join(__dirname, 'index.js'),
            `ws://localhost:${port}`,
          ],
          {
            stdio: 'inherit',
          }
        );
        childProcesses.push(inspectorProcess);

        inspectorProcess.on('error', (err) => {
          console.error('Failed to start MCP Inspector:', err);
        });
      }, 1000);
    }

    bridgeProcess.on('error', (err) => {
      console.error('Failed to start bridge:', err);
      process.exit(1);
    });

    // Handle shutdown
    const shutdown = async () => {
      console.log('\nShutting down...');
      for (const child of childProcesses) {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      }

      // Give processes time to clean up
      setTimeout(() => {
        for (const child of childProcesses) {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

program
  .command('proxy <websocket-url>')
  .description('Start a STDIO-to-WebSocket proxy for connecting STDIO clients')
  .action((wsUrl) => {
    console.log(`Starting STDIO-to-WebSocket proxy for ${wsUrl}...`);

    const proxyProcess = spawn('node', [join(__dirname, 'index.js'), wsUrl], {
      stdio: 'inherit',
    });
    childProcesses.push(proxyProcess);

    proxyProcess.on('error', (err) => {
      console.error('Failed to start proxy:', err);
      process.exit(1);
    });

    // Handle shutdown
    const shutdown = async () => {
      console.log('\nShutting down proxy...');
      for (const child of childProcesses) {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      }

      setTimeout(() => {
        for (const child of childProcesses) {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

program
  .command('inspect [websocket-url]')
  .description('Start MCP Inspector with the WebSocket bridge')
  .option('-p, --port <port>', 'Port for the bridge server', '8021')
  .action((wsUrl, options) => {
    const url = wsUrl || `ws://localhost:${options.port}`;

    console.log(`Starting MCP Inspector connected to ${url}...`);

    const inspectorProcess = spawn(
      'npx',
      ['@modelcontextprotocol/inspector', 'node', join(__dirname, 'index.js'), url],
      {
        stdio: 'inherit',
      }
    );
    childProcesses.push(inspectorProcess);

    inspectorProcess.on('error', (err) => {
      console.error('Failed to start MCP Inspector:', err);
      process.exit(1);
    });

    // Handle shutdown
    const shutdown = async () => {
      console.log('\nShutting down...');
      for (const child of childProcesses) {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      }

      setTimeout(() => {
        for (const child of childProcesses) {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

program
  .command('stdio')
  .description('Start bridge server and STDIO proxy for MCP hosts (Claude Desktop, Cursor, etc)')
  .option('-p, --port <port>', 'Port to run the bridge on', '8021')
  .action(async (options) => {
    const port = parseInt(options.port);

    // Check if port is available
    const isAvailable = await checkPort(port);
    if (!isAvailable) {
      console.error(`Error: Port ${port} is already in use.`);
      console.error('Please choose a different port using the --port option.');
      process.exit(1);
    }

    console.log(`Starting MCP WebSocket Bridge with STDIO proxy on port ${port}...`);
    console.log('');

    // Start the bridge server
    const bridgeProcess = spawn('node', [join(__dirname, 'bridge-server.js')], {
      stdio: 'inherit',
      env: { ...process.env, PORT: port.toString() },
    });
    childProcesses.push(bridgeProcess);

    bridgeProcess.on('error', (err) => {
      console.error('Failed to start bridge:', err);
      process.exit(1);
    });

    // Give the bridge a moment to start
    setTimeout(() => {
      console.log('Starting STDIO proxy...');
      console.log('Ready for MCP host connections via STDIO');

      // Start the proxy connected to the bridge
      const proxyProcess = spawn('node', [join(__dirname, 'index.js'), `ws://localhost:${port}`], {
        stdio: 'inherit',
      });
      childProcesses.push(proxyProcess);

      proxyProcess.on('error', (err) => {
        console.error('Failed to start proxy:', err);
        bridgeProcess.kill();
        process.exit(1);
      });

      // Handle shutdown
      const shutdown = async () => {
        console.log('\nShutting down...');
        for (const child of childProcesses) {
          if (!child.killed) {
            child.kill('SIGTERM');
          }
        }

        setTimeout(() => {
          for (const child of childProcesses) {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }
          process.exit(0);
        }, 2000);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    }, 1000);
  });

program.parse();
