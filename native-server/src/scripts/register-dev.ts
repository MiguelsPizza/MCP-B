import os from 'node:os';
import path from 'node:path';
import { createManifestContent, mkdir, writeFile, colorText } from './utils';
import { HOST_NAME } from './constant';

/**
 * Chrome for Testing data paths for different platforms
 */
function getChromeForTestingDataPaths(): string[] {
  const paths: string[] = [];

  if (os.platform() === 'darwin') {
    paths.push(
      // Persistent WXT profile directory (configured in web-ext.config.ts)
      path.resolve(__dirname, '../../../extension/.wxt/chrome-data/NativeMessagingHosts'),
      // Temporary WXT profile directory (fallback for older setups)
      path.join(os.tmpdir(), 'wxt-chrome-data', 'NativeMessagingHosts'),
      path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'Chrome for Testing',
        'NativeMessagingHosts'
      ),
      path.join(os.homedir(), 'Library', 'Application Support', 'Chromium', 'NativeMessagingHosts')
    );
  } else if (os.platform() === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    paths.push(
      // Persistent WXT profile directory (configured in web-ext.config.ts)
      path.resolve(__dirname, '../../../extension/.wxt/chrome-data/NativeMessagingHosts'),
      // Temporary WXT profile directory (fallback for older setups)
      path.join(localAppData, 'Temp', 'wxt-chrome-data', 'NativeMessagingHosts'),
      path.join(appData, 'Chrome for Testing', 'NativeMessagingHosts'),
      path.join(appData, 'Chromium', 'NativeMessagingHosts')
    );
  } else {
    paths.push(
      // Persistent WXT profile directory (configured in web-ext.config.ts)
      path.resolve(__dirname, '../../../extension/.wxt/chrome-data/NativeMessagingHosts'),
      // Temporary WXT profile directory (fallback for older setups)
      path.join(os.tmpdir(), 'wxt-chrome-data', 'NativeMessagingHosts'),
      path.join(os.homedir(), '.config', 'chrome-for-testing', 'NativeMessagingHosts'),
      path.join(os.homedir(), '.config', 'chromium', 'NativeMessagingHosts')
    );
  }

  return paths;
}

/**
 * Register native messaging host for Chrome for Testing
 */
async function registerForChromeForTesting(): Promise<boolean> {
  const paths = getChromeForTestingDataPaths();
  let success = false;

  for (const manifestDir of paths) {
    try {
      await mkdir(manifestDir, { recursive: true });
      const manifestPath = path.join(manifestDir, `${HOST_NAME}.json`);
      const manifest = await createManifestContent(); // Use both extension IDs

      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(colorText(`✓ Registered manifest at: ${manifestPath}`, 'green'));
      success = true;
    } catch (error) {
      console.log(
        colorText(
          `⚠️ Failed to register at ${manifestDir}: ${error instanceof Error ? error.message : String(error)}`,
          'yellow'
        )
      );
    }
  }

  return success;
}

/**
 * Register native messaging host for regular Chrome (user-level)
 */
async function registerForRegularChrome(): Promise<boolean> {
  try {
    let manifestPath: string;

    if (os.platform() === 'darwin') {
      manifestPath = path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'Google',
        'Chrome',
        'NativeMessagingHosts',
        `${HOST_NAME}.json`
      );
    } else if (os.platform() === 'win32') {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      manifestPath = path.join(
        appData,
        'Google',
        'Chrome',
        'NativeMessagingHosts',
        `${HOST_NAME}.json`
      );
    } else {
      manifestPath = path.join(
        os.homedir(),
        '.config',
        'google-chrome',
        'NativeMessagingHosts',
        `${HOST_NAME}.json`
      );
    }

    await mkdir(path.dirname(manifestPath), { recursive: true });
    const manifest = await createManifestContent(); // Use both extension IDs

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(colorText(`✓ Registered manifest at: ${manifestPath}`, 'green'));
    return true;
  } catch (error) {
    console.log(
      colorText(
        `⚠️ Failed to register for regular Chrome: ${error instanceof Error ? error.message : String(error)}`,
        'yellow'
      )
    );
    return false;
  }
}

async function main() {
  console.log(colorText('🚀 Registering native messaging host for development...', 'blue'));

  const regularSuccess = await registerForRegularChrome();
  const chromeForTestingSuccess = await registerForChromeForTesting();

  if (regularSuccess || chromeForTestingSuccess) {
    console.log(colorText('✅ Development registration complete!', 'green'));
    console.log(colorText(`   Using dev extension ID: oeidgnbdmdjeacgmfhemhpngaplpkiel`, 'blue'));
  } else {
    console.error(colorText('❌ Failed to register for any Chrome version', 'red'));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
