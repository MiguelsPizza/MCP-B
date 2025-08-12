#!/usr/bin/env node

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface TestOptions {
  script?: string;
  headless?: boolean;
  watch?: boolean;
}

function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--script':
        options.script = args[++i];
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--help':
        console.log(`
Usage: pnpm test:runner [options]

Options:
  --script <name>    Run tests for specific script (e.g., gmail)
  --headless         Run tests in headless mode
  --watch            Run tests in watch mode
  --help             Show this help message

Examples:
  pnpm test:runner --script gmail
  pnpm test:runner --headless
  pnpm test:runner --watch --script gmail
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

async function main() {
  const options = parseArgs();
  
  console.log('🧪 Running Tampermonkey MCP-B tests...\n');
  
  // Set environment variables
  const env = {
    ...process.env,
    CI: options.headless ? 'true' : 'false',
  };
  
  // Build test command
  let testCommand = 'pnpm test';
  
  if (options.script) {
    testCommand += `:${options.script}`;
  }
  
  if (options.watch) {
    testCommand += ':watch';
  }
  
  console.log(`📋 Command: ${testCommand}`);
  console.log(`🖥️  Mode: ${options.headless ? 'Headless' : 'UI'}`);
  
  if (options.script) {
    console.log(`📁 Script: ${options.script}`);
  }
  
  console.log('');
  
  try {
    // First ensure dependencies are installed
    console.log('📦 Installing test dependencies...');
    execSync('pnpm install', { 
      cwd: join(projectRoot, 'tests'),
      stdio: 'pipe'
    });
    
    // Run the tests
    execSync(testCommand, {
      cwd: join(projectRoot, 'tests'),
      stdio: 'inherit',
      env,
    });
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Tests failed');
    
    if (error instanceof Error && 'status' in error) {
      process.exit(error.status as number);
    } else {
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});