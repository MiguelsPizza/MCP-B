#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  tryRegisterUserLevelHost,
  colorText,
  registerWithElevatedPermissions,
  ensureExecutionPermissions,
} from './scripts/utils';

// Import writeNodePath from postinstall
async function writeNodePath(): Promise<void> {
  try {
    const nodePath = process.execPath;
    const nodePathFile = path.join(__dirname, 'node_path.txt');

    console.log(colorText(`Writing Node.js path: ${nodePath}`, 'blue'));
    fs.writeFileSync(nodePathFile, nodePath, 'utf8');
    console.log(colorText('✓ Node.js path written for run_host scripts', 'green'));
  } catch (error: any) {
    console.warn(colorText(`⚠️ Failed to write Node.js path: ${error.message}`, 'yellow'));
  }
}

program
  .version(require('../package.json').version)
  .description('Mcp Chrome Bridge - Local service for communicating with Chrome extension');

// Register Native Messaging host
program
  .command('register')
  .description('Register Native Messaging host')
  .option('-f, --force', 'Force re-registration')
  .option('-s, --system', 'Use system-level installation (requires administrator/sudo privileges)')
  .action(async (options) => {
    try {
      // Write Node.js path for run_host scripts
      await writeNodePath();

      // Detect if running with root/administrator privileges
      const isRoot = process.getuid && process.getuid() === 0; // Unix/Linux/Mac

      let isAdmin = false;
      if (process.platform === 'win32') {
        try {
          isAdmin = require('is-admin')(); // Windows requires additional package
        } catch (error) {
          console.warn(
            colorText('Warning: Unable to detect administrator privileges on Windows', 'yellow')
          );
          isAdmin = false;
        }
      }

      const hasElevatedPermissions = isRoot || isAdmin;

      // If --system option is specified or running with root/administrator privileges
      if (options.system || hasElevatedPermissions) {
        await registerWithElevatedPermissions();
        console.log(
          colorText('System-level Native Messaging host registered successfully!', 'green')
        );
        console.log(
          colorText(
            'You can now use connectNative in Chrome extension to connect to this service.',
            'blue'
          )
        );
      } else {
        // Regular user-level installation
        console.log(colorText('Registering user-level Native Messaging host...', 'blue'));
        const success = await tryRegisterUserLevelHost();

        if (success) {
          console.log(colorText('Native Messaging host registered successfully!', 'green'));
          console.log(
            colorText(
              'You can now use connectNative in Chrome extension to connect to this service.',
              'blue'
            )
          );
        } else {
          console.log(
            colorText('User-level registration failed, please try the following methods:', 'yellow')
          );
          console.log(colorText('  1. sudo mcp-chrome-bridge register', 'yellow'));
          console.log(colorText('  2. mcp-chrome-bridge register --system', 'yellow'));
          process.exit(1);
        }
      }
    } catch (error: any) {
      console.error(colorText(`Registration failed: ${error.message}`, 'red'));
      process.exit(1);
    }
  });

// Fix execution permissions
program
  .command('fix-permissions')
  .description('Fix execution permissions for native host files')
  .action(async () => {
    try {
      console.log(colorText('Fixing execution permissions...', 'blue'));
      await ensureExecutionPermissions();
      console.log(colorText('✓ Execution permissions fixed successfully!', 'green'));
    } catch (error: any) {
      console.error(colorText(`Failed to fix permissions: ${error.message}`, 'red'));
      process.exit(1);
    }
  });

// Update port in stdio-config.json
program
  .command('update-port <port>')
  .description('Update the port number in stdio-config.json')
  .action(async (port: string) => {
    try {
      const portNumber = parseInt(port, 10);
      if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
        console.error(colorText('Error: Port must be a valid number between 1 and 65535', 'red'));
        process.exit(1);
      }

      const configPath = path.join(__dirname, 'mcp', 'stdio-config.json');

      if (!fs.existsSync(configPath)) {
        console.error(colorText(`Error: Configuration file not found at ${configPath}`, 'red'));
        process.exit(1);
      }

      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      const currentUrl = new URL(config.url);
      currentUrl.port = portNumber.toString();
      config.url = currentUrl.toString();

      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

      console.log(colorText(`✓ Port updated successfully to ${portNumber}`, 'green'));
      console.log(colorText(`Updated URL: ${config.url}`, 'blue'));
    } catch (error: any) {
      console.error(colorText(`Failed to update port: ${error.message}`, 'red'));
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
