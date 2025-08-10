import { MinimalWindow } from '../types';

export function channelWindow(window: MinimalWindow, id: string): MinimalWindow {
  // Store the original postMessage function
  const originalPostMessage = window.postMessage.bind(window);

  interface WrappedMessage {
    __channelId: string;
    payload: unknown;
  }

  // Create a wrapped postMessage that includes the channel ID
  const wrappedPostMessage = (
    message: unknown,
    targetOriginOrOptions: string | WindowPostMessageOptions = '*',
    transfer?: Transferable[]
  ) => {
    const wrappedMessage: WrappedMessage = {
      __channelId: id, // Using the channel ID passed to channelWindow
      payload: message,
    };

    if (typeof targetOriginOrOptions === 'string') {
      return originalPostMessage(wrappedMessage, targetOriginOrOptions, transfer);
    }
    return originalPostMessage(wrappedMessage, targetOriginOrOptions);
  };

  // Create a wrapped addEventListener that filters by channel ID
  const originalAddEventListener = window.addEventListener.bind(window);
  const wrappedAddEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    if (type !== 'message') {
      return originalAddEventListener(type, listener, options);
    }

    const wrappedListener = (event: MessageEvent<unknown>) => {
      const data = event.data;
      // Type guard to ensure data has the correct shape
      const isWrappedMessage = (data: unknown): data is WrappedMessage => {
        return (
          data !== null &&
          typeof data === 'object' &&
          '__channelId' in data &&
          'payload' in data &&
          typeof data.__channelId === 'string'
        );
      };

      // Only process messages with matching channel ID
      if (isWrappedMessage(data) && data.__channelId === id) {
        const newEvent = new MessageEvent('message', {
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          composed: event.composed,
          data: data.payload,
          origin: event.origin,
          lastEventId: event.lastEventId,
          source: event.source,
          ports: Array.from(event.ports),
        });

        if (typeof listener === 'function') {
          listener(newEvent);
        } else {
          listener.handleEvent(newEvent);
        }
      }
    };

    return originalAddEventListener('message', wrappedListener as EventListener, options);
  };

  // Create a wrapped removeEventListener that handles the wrapped listeners
  const originalRemoveEventListener = window.removeEventListener.bind(window);

  return {
    ...window,
    postMessage: wrappedPostMessage,
    addEventListener: wrappedAddEventListener,
    removeEventListener: originalRemoveEventListener,
  };
}
