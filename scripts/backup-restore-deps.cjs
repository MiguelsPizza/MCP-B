#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Utility script to backup and restore package.json files
 * Used to test the replace-workspace-deps script safely
 */

function getPackageJsonPaths() {
  const paths = [];

  // Find all package.json files in workspace packages
  const packagesDir = path.join(process.cwd(), 'packages');
  if (fs.existsSync(packagesDir)) {
    const packageDirs = fs.readdirSync(packagesDir);

    for (const dir of packageDirs) {
      const packagePath = path.join(packagesDir, dir, 'package.json');
      if (fs.existsSync(packagePath)) {
        paths.push(packagePath);
      }
    }
  }

  // Also check native-server
  const nativeServerPath = path.join(process.cwd(), 'native-server', 'package.json');
  if (fs.existsSync(nativeServerPath)) {
    paths.push(nativeServerPath);
  }

  return paths;
}

function backup() {
  const paths = getPackageJsonPaths();

  console.log('Backing up package.json files...');
  for (const packagePath of paths) {
    const backupPath = packagePath + '.backup';
    fs.copyFileSync(packagePath, backupPath);
    console.log(`  ✓ Backed up ${path.relative(process.cwd(), packagePath)}`);
  }
  console.log('✓ All packages backed up');
}

function restore() {
  const paths = getPackageJsonPaths();

  console.log('Restoring package.json files...');
  for (const packagePath of paths) {
    const backupPath = packagePath + '.backup';
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, packagePath);
      fs.unlinkSync(backupPath);
      console.log(`  ✓ Restored ${path.relative(process.cwd(), packagePath)}`);
    }
  }
  console.log('✓ All packages restored');
}

function main() {
  const action = process.argv[2];

  if (action === 'backup') {
    backup();
  } else if (action === 'restore') {
    restore();
  } else {
    console.error('Usage: node backup-restore-deps.cjs <backup|restore>');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backup, restore };
