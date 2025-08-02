#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to replace "workspace:*" and "catalog:" dependencies with actual versions
 * before publishing to npm. This ensures packages work correctly when installed from npm.
 */

function loadWorkspacePackages() {
  const packages = new Map();

  // Find all package.json files in workspace packages
  const packagesDir = path.join(process.cwd(), 'packages');
  if (fs.existsSync(packagesDir)) {
    const packageDirs = fs.readdirSync(packagesDir);

    for (const dir of packageDirs) {
      const packagePath = path.join(packagesDir, dir, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        packages.set(pkg.name, pkg.version);
      }
    }
  }

  // Also check native-server
  const nativeServerPath = path.join(process.cwd(), 'native-server', 'package.json');
  if (fs.existsSync(nativeServerPath)) {
    const pkg = JSON.parse(fs.readFileSync(nativeServerPath, 'utf8'));
    packages.set(pkg.name, pkg.version);
  }

  return packages;
}

function loadCatalogDependencies() {
  const workspaceFile = path.join(process.cwd(), 'pnpm-workspace.yaml');
  if (!fs.existsSync(workspaceFile)) {
    return new Map();
  }

  const yamlContent = fs.readFileSync(workspaceFile, 'utf8');
  const catalog = new Map();

  // Parse the catalog section from YAML
  const lines = yamlContent.split('\n');
  let inCatalog = false;

  for (const line of lines) {
    if (line.trim() === 'catalog:') {
      inCatalog = true;
      continue;
    }

    if (inCatalog) {
      // Stop if we hit another top-level section
      if (line.match(/^[a-zA-Z]/)) {
        break;
      }

      // Parse catalog entries - handle both quoted and unquoted keys
      const match = line.match(/^\s+"?([^":]+)"?\s*:\s*(.+)$/);
      if (match) {
        const [, packageName, version] = match;
        catalog.set(packageName.trim(), version.trim());
      }
    }
  }

  return catalog;
}

function replaceWorkspaceDependencies(packageJsonPath) {
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Package.json not found: ${packageJsonPath}`);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const workspacePackages = loadWorkspacePackages();
  const catalogDeps = loadCatalogDependencies();
  let modified = false;

  // Helper function to process dependencies object
  function processDeps(deps) {
    if (!deps) return;

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (depVersion === 'workspace:*') {
        if (workspacePackages.has(depName)) {
          deps[depName] = `^${workspacePackages.get(depName)}`;
          console.log(`  ${depName}: workspace:* -> ^${workspacePackages.get(depName)}`);
          modified = true;
        } else {
          console.warn(`  Warning: workspace package ${depName} not found`);
        }
      } else if (depVersion === 'catalog:') {
        if (catalogDeps.has(depName)) {
          deps[depName] = catalogDeps.get(depName);
          console.log(`  ${depName}: catalog: -> ${catalogDeps.get(depName)}`);
          modified = true;
        } else {
          console.warn(`  Warning: catalog dependency ${depName} not found`);
        }
      }
    }
  }

  console.log(`Processing ${pkg.name}...`);

  // Process all dependency types
  processDeps(pkg.dependencies);
  processDeps(pkg.devDependencies);
  processDeps(pkg.peerDependencies);
  processDeps(pkg.optionalDependencies);

  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✓ Updated ${packageJsonPath}`);
  } else {
    console.log(`  - No changes needed for ${pkg.name}`);
  }

  return modified;
}

function main() {
  const targetPath = process.argv[2];

  if (!targetPath) {
    console.error('Usage: node replace-workspace-deps.js <path-to-package.json>');
    process.exit(1);
  }

  const packageJsonPath = path.resolve(targetPath);
  console.log(`Replacing workspace and catalog dependencies in: ${packageJsonPath}`);

  const success = replaceWorkspaceDependencies(packageJsonPath);

  if (success) {
    console.log('✓ Dependencies updated successfully');
  } else {
    console.log('- No updates needed');
  }
}

if (require.main === module) {
  main();
}

module.exports = { replaceWorkspaceDependencies, loadWorkspacePackages, loadCatalogDependencies };
