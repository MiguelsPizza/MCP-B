import type { TRPCLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';

import { TRPC_BROWSER_LOADED_EVENT } from '../shared/constants';
import type { MinimalPopupWindow, MinimalWindow, TRPCChromeMessage } from '../types';
import { createBaseLink } from './internal/base';

export type PopupLinkOptions = {
  createPopup: () => MinimalPopupWindow;
  listenWindow: MinimalWindow;
  postOrigin?: string;
};

export const popupLink = <TRouter extends AnyRouter>(opts: PopupLinkOptions): TRPCLink<TRouter> => {
  const messageHandlerMap = new Map<
    (message: TRPCChromeMessage) => void,
    (ev: MessageEvent<TRPCChromeMessage>) => void
  >();
  const closeHandlerSet = new Set<() => void>();

  let popupWindow: MinimalPopupWindow | null = null;
  async function getPopup(loadListenWindow: MinimalWindow) {
    if (!popupWindow || popupWindow.closed) {
      popupWindow = opts.createPopup();
      await Promise.race([
        // wait til window is loaded (same origin)
        new Promise((resolve) => {
          try {
            popupWindow?.addEventListener?.('load', resolve);
          } catch {
            // if this throws, it's a cross-origin popup and should stay pending (never resolve)
          }
        }),
        // this is needed for cross-origin popups as they don't have a load event
        new Promise<void>((resolve) => {
          loadListenWindow.addEventListener('message', (event) => {
            if (event.data === TRPC_BROWSER_LOADED_EVENT) {
              resolve();
            }
          });
        }),
        // expect the popup to load after 15s max, in case non of the above events fire
        new Promise((resolve) => {
          console.warn(
            'Could not detect if popup loading succeeded after 15s timeout, continuing anyway'
          );
          setTimeout(resolve, 15000);
        }),
      ]);

      // subscribe to popup closing
      try {
        if (!popupWindow.addEventListener) {
          throw new Error('popupWindow.addEventListener is not a function');
        }
        popupWindow.addEventListener('beforeunload', () => {
          popupWindow = null;
        });
      } catch {
        // this throws on cross-origin popups, fallback to polling to check if popup is closed
        const pid = setInterval(() => {
          if (popupWindow && popupWindow.closed) {
            popupWindow = null;
            closeHandlerSet.forEach((handler) => {
              handler();
            });
            clearInterval(pid);
          }
        }, 1000);
      }
    }

    return popupWindow;
  }

  return createBaseLink({
    async postMessage(message) {
      const popup = await getPopup(opts.listenWindow);
      return popup.postMessage(message, {
        targetOrigin: opts.postOrigin,
      });
    },
    addMessageListener(listener) {
      const handler = (ev: MessageEvent<TRPCChromeMessage>) => {
        listener(ev.data);
      };
      messageHandlerMap.set(listener, handler);
      opts.listenWindow.addEventListener('message', handler);
    },
    removeMessageListener(listener) {
      const handler = messageHandlerMap.get(listener);
      if (handler) {
        opts.listenWindow.removeEventListener('message', handler);
      }
    },
    addCloseListener(listener) {
      opts.listenWindow.addEventListener('beforeunload', listener);
      closeHandlerSet.add(listener);
    },
    removeCloseListener(listener) {
      opts.listenWindow.removeEventListener('beforeunload', listener);
      closeHandlerSet.delete(listener);
    },
  });
};
