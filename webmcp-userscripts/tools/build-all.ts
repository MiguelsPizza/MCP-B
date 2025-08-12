#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔨 Building all Tampermonkey MCP-B scripts...\n');

// Build shared package first
console.log('📦 Building shared package...');
try {
  execSync('pnpm run build', {
    cwd: join(projectRoot, 'packages/shared'),
    stdio: 'inherit',
  });
  console.log('✅ Shared package built successfully\n');
} catch (error) {
  console.error('❌ Failed to build shared package');
  process.exit(1);
}

// Find all script directories
const scriptsDir = join(projectRoot, 'scripts');
const scriptDirs = readdirSync(scriptsDir).filter(dir => {
  const scriptPath = join(scriptsDir, dir);
  return statSync(scriptPath).isDirectory() && readdirSync(scriptPath).includes('package.json');
});

console.log(`Found ${scriptDirs.length} script(s): ${scriptDirs.join(', ')}\n`);

// Build each script
let successCount = 0;
let failureCount = 0;

for (const scriptDir of scriptDirs) {
  const scriptPath = join(scriptsDir, scriptDir);
  console.log(`🔨 Building ${scriptDir}...`);

  try {
    // Install dependencies first
    execSync('pnpm install', {
      cwd: scriptPath,
      stdio: 'pipe',
    });

    // Build the script
    execSync('pnpm run build', {
      cwd: scriptPath,
      stdio: 'inherit',
    });

    console.log(`✅ ${scriptDir} built successfully`);
    successCount++;
  } catch (error) {
    console.error(
      `❌ Failed to build ${scriptDir}:`,
      error instanceof Error ? error.message : error
    );
    failureCount++;
  }

  console.log('');
}

// Summary
console.log('📊 Build Summary:');
console.log(`✅ Successfully built: ${successCount}`);
console.log(`❌ Failed to build: ${failureCount}`);

if (failureCount > 0) {
  console.log('\n💡 Tip: Run individual builds with:');
  console.log('   cd scripts/<script-name> && pnpm run build');
  process.exit(1);
} else {
  console.log('\n🎉 All scripts built successfully!');
  console.log('\n📁 Output files are in scripts/*/dist/*.user.js');
}
