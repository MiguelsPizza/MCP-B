import type { TRPCLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';

import type { MinimalWindow, TRPCChromeMessage } from '../types';
import { createBaseLink } from './internal/base';

export type WindowLinkOptions = {
  window: MinimalWindow;
  postWindow?: MinimalWindow;
  postOrigin?: string;
};

export const windowLink = <TRouter extends AnyRouter>(
  opts: WindowLinkOptions
): TRPCLink<TRouter> => {
  const handlerMap = new Map<
    (message: TRPCChromeMessage) => void,
    (ev: MessageEvent<TRPCChromeMessage>) => void
  >();

  const listenWindow = opts.window;
  const postWindow = opts.postWindow ?? listenWindow;

  const safeEventListener = <K extends keyof WindowEventMap>(
    action: 'add' | 'remove',
    event: K,
    handler: (ev: WindowEventMap[K]) => void
  ) => {
    try {
      listenWindow[`${action}EventListener`](event, handler as EventListener);
    } catch (err) {
      console.error(`Failed to ${action} ${event} listener:`, err);
    }
  };

  return createBaseLink({
    postMessage(message) {
      postWindow.postMessage(message, {
        targetOrigin: opts.postOrigin,
      });
    },
    addMessageListener(listener) {
      const handler = (ev: MessageEvent<TRPCChromeMessage>) => {
        listener(ev.data);
      };
      handlerMap.set(listener, handler);
      safeEventListener('add', 'message', handler);
    },
    removeMessageListener(listener) {
      const handler = handlerMap.get(listener);
      if (handler) {
        safeEventListener('remove', 'message', handler);
      }
    },
    addCloseListener(listener) {
      safeEventListener('add', 'beforeunload', listener);
    },
    removeCloseListener(listener) {
      safeEventListener('remove', 'beforeunload', listener);
    },
  });
};
