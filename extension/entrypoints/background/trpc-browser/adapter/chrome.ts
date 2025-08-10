import { AnyProcedure, AnyRouter, TRPCError } from '@trpc/server';
import { Unsubscribable, isObservable } from '@trpc/server/observable';
import { getErrorShape } from '@trpc/server/shared';

import { isTRPCRequestWithId } from '../shared/trpcMessage';
import type { TRPCChromeResponse } from '../types';
import type { CreateHandlerOptions } from './base';
import { getErrorFromUnknown } from './errors';

export type CreateChromeContextOptions = {
  req: chrome.runtime.Port;
  res: undefined;
};
type ChromeOptions = {
  chrome?: typeof chrome;
};
type ChromeContextOptions = { req: chrome.runtime.Port; res: undefined };

export const createChromeHandler = <TRouter extends AnyRouter>(
  opts: CreateHandlerOptions<TRouter, ChromeContextOptions, ChromeOptions>
) => {
  const { router, createContext, onError, chrome } = opts;
  if (!chrome) {
    console.warn("Skipping chrome handler creation: 'opts.chrome' not defined");
    return;
  }

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'BGSW') return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { transformer } = router._def._config;
    const subscriptions = new Map<number | string, Unsubscribable>();
    const listeners: (() => void)[] = [];

    const cleanup = () => listeners.forEach((unsub) => unsub());
    port.onDisconnect.addListener(cleanup);
    listeners.push(() => port.onDisconnect.removeListener(cleanup));

    const onMessage = async (message: unknown) => {
      if (!port || !isTRPCRequestWithId(message)) return;

      const { trpc } = message;
      const sendResponse = (response: TRPCChromeResponse['trpc']) => {
        port.postMessage({
          trpc: { id: trpc.id, jsonrpc: trpc.jsonrpc, ...response },
        } as TRPCChromeResponse);
      };

      if (trpc.method === 'subscription.stop') {
        subscriptions.get(trpc.id)?.unsubscribe();
        subscriptions.delete(trpc.id);
        return sendResponse({ result: { type: 'stopped' } });
      }
      const { method, params, id } = trpc;

      const ctx = await createContext?.({ req: port, res: undefined });
      const handleError = (cause: unknown) => {
        const error = getErrorFromUnknown(cause);

        onError?.({
          error,
          type: method,
          path: params.path,
          input: params.input,
          ctx,
          req: port,
        });

        sendResponse({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          error: getErrorShape({
            config: router._def._config,
            error,
            type: method,
            path: params.path,
            input: params.input,
            ctx,
          }),
        });
      };

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const input = transformer.input.deserialize(trpc.params.input);
        const caller = router.createCaller(ctx);

        const procedureFn = trpc.params.path
          .split('.')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
          .reduce((acc, segment) => acc[segment], caller as any) as AnyProcedure;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const result = await procedureFn(input);
        if (trpc.method !== 'subscription') {
          return sendResponse({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            result: { type: 'data', data: transformer.output.serialize(result) },
          });
        }

        if (!isObservable(result)) {
          throw new TRPCError({
            message: `Subscription ${params.path} did not return an observable`,
            code: 'INTERNAL_SERVER_ERROR',
          });
        }

        const subscription = result.subscribe({
          next: (data) => {
            const serializedData = transformer.output.serialize(data);
            sendResponse({ result: { type: 'data', data: serializedData } });
          },
          error: handleError,
          complete: () => sendResponse({ result: { type: 'stopped' } }),
        });

        if (subscriptions.has(id)) {
          subscription.unsubscribe();
          sendResponse({ result: { type: 'stopped' } });
          throw new TRPCError({ message: `Duplicate id ${id}`, code: 'BAD_REQUEST' });
        }

        listeners.push(() => subscription.unsubscribe());
        subscriptions.set(id, subscription);
        sendResponse({ result: { type: 'started' } });
      } catch (cause) {
        handleError(cause);
      }
    };

    port.onMessage.addListener(onMessage);
    listeners.push(() => port.onMessage.removeListener(onMessage));
  });
};
