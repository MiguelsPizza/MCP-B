#!/usr/bin/env node

import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createInterface } from 'readline/promises';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Clearing native messaging configurations...\n');

// Helper function to remove files
async function removeFile(filePath) {
  if (existsSync(filePath)) {
    console.log(`Removing: ${filePath}`);
    try {
      await rm(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${filePath}:`, error.message);
      return false;
    }
  }
  return false;
}

// Define paths
const home = homedir();
const nativeHostPaths = [
  join(home, 'Library/Application Support/Google/Chrome/NativeMessagingHosts/com.chromemcp.nativehost.json'),
  join(home, 'Library/Application Support/Google/Chrome Beta/NativeMessagingHosts/com.chromemcp.nativehost.json'),
  join(home, 'Library/Application Support/Google/Chrome Canary/NativeMessagingHosts/com.chromemcp.nativehost.json'),
  join(home, 'Library/Application Support/Google/Chrome Dev/NativeMessagingHosts/com.chromemcp.nativehost.json'),
  join(home, 'Library/Application Support/Chromium/NativeMessagingHosts/com.chromemcp.nativehost.json'),
];

// WXT persistent profile path
const wxtPath = join(process.cwd(), 'extension/.wxt/chrome-data/NativeMessagingHosts/com.chromemcp.nativehost.json');

// MCP configuration paths
const mcpConfigs = [
  { path: join(home, '.cursor/mcp.json'), name: 'Cursor MCP config' },
  { path: join(home, 'Library/Application Support/Claude/claude_desktop_config.json'), name: 'Claude Desktop config' }
];

async function main() {
  let removedCount = 0;

  // Remove native messaging hosts
  console.log('Removing native messaging host files...');
  for (const path of nativeHostPaths) {
    if (await removeFile(path)) {
      removedCount++;
    }
  }

  // Remove WXT profile
  if (await removeFile(wxtPath)) {
    removedCount++;
  }

  console.log();

  // Handle MCP configs
  for (const config of mcpConfigs) {
    if (existsSync(config.path)) {
      console.log(`Found ${config.name} at: ${config.path}`);
      const answer = await rl.question('Do you want to remove this file? (y/n) ');
      
      if (answer.toLowerCase() === 'y') {
        if (await removeFile(config.path)) {
          removedCount++;
        }
      }
    }
  }

  rl.close();

  console.log(`\n✅ Cleared ${removedCount} configuration files!`);
  console.log('\nTo reinstall, run: pnpm dev');
}

main().catch(console.error);