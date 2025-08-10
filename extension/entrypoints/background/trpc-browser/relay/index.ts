// can relay messages between two links
import { isTRPCMessage } from '../shared/trpcMessage';
import type { MinimalWindow, RelayedTRPCMessage } from '../types';

type UnSubscibeFn = () => void;

export function relay(
  window: MinimalWindow,
  port: chrome.runtime.Port,
  windowPostOrigin?: string
): UnSubscibeFn {
  function relayToWindow(message: RelayedTRPCMessage) {
    if (message.relayed) return;
    const relayedMessage: RelayedTRPCMessage = { ...message, relayed: true };
    window.postMessage(relayedMessage, {
      targetOrigin: windowPostOrigin,
    });
  }
  function relayToPort(message: RelayedTRPCMessage) {
    if (message.relayed) return;
    const relayedMessage: RelayedTRPCMessage = { ...message, relayed: true };
    port.postMessage(relayedMessage);
  }

  const onWindowMessage = (event: MessageEvent<unknown>) => {
    if (!isTRPCMessage(event.data)) return;
    relayToPort(event.data);
  };
  const onPortMessage = (message: unknown) => {
    if (!isTRPCMessage(message)) return;
    relayToWindow(message);
  };

  window.addEventListener('message', onWindowMessage);
  port.onMessage.addListener(onPortMessage);

  return () => {
    window.removeEventListener('message', onWindowMessage);
    port.onMessage.removeListener(onPortMessage);
  };
}
