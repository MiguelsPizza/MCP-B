import type { TRPCLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';

import { createBaseLink } from './internal/base';

export type ChromeLinkOptions = {
  port: chrome.runtime.Port;
};

export const chromeLink = <TRouter extends AnyRouter>(
  opts: ChromeLinkOptions
): TRPCLink<TRouter> => {
  return createBaseLink({
    postMessage(message) {
      opts.port.postMessage(message);
    },
    addMessageListener(listener) {
      opts.port.onMessage.addListener(listener);
    },
    removeMessageListener(listener) {
      opts.port.onMessage.removeListener(listener);
    },
    addCloseListener(listener) {
      opts.port.onDisconnect.addListener(listener);
    },
    removeCloseListener(listener) {
      opts.port.onDisconnect.removeListener(listener);
    },
  });
};
