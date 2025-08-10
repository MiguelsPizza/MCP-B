import { retry, wait } from './retry';

type AllowCleanUpFunction = void | (() => void);

/**
 * Creates a port and recreates a new port if the old one disconnects
 *
 * @param createPort - function to create a port
 * @param onConnect - callback when connected
 */
export async function autoConnect(
  createPort: () => chrome.runtime.Port,
  onConnect: (port: chrome.runtime.Port) => AllowCleanUpFunction
) {
  const port = await retry(
    createPort,
    3, // 3 retries plus the initial try, so 4 total tries
    (retry) => wait(retry * 100) // 100ms, 200ms, 300ms, max total wait 600ms
  );
  console.log('Port connected');
  const cleanUp = onConnect(port);
  port.onDisconnect.addListener(() => {
    cleanUp?.();
    console.log('Port disconnected, reconnecting...');
    void autoConnect(createPort, onConnect);
  });
}

/**
 * Reconnects a port if it disconnects
 * @param port - port to reconnect
 * @param createPort - function to create a port
 * @param onConnect - callback when connected
 */
export function autoReconnect(
  port: chrome.runtime.Port,
  createPort: () => chrome.runtime.Port,
  onReconnect: (port: chrome.runtime.Port) => AllowCleanUpFunction
) {
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected, reconnecting...');
    void autoConnect(createPort, onReconnect);
  });
}
