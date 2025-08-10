import { OperationResultEnvelope, TRPCClientError, TRPCLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';
import { observable } from '@trpc/server/observable';

import { isTRPCResponse } from '../../shared/trpcMessage';
import type { MessengerMethods, TRPCChromeRequest } from '../../types';

export const createBaseLink = <TRouter extends AnyRouter>(
  methods: MessengerMethods
): TRPCLink<TRouter> => {
  return (runtime) => {
    return ({ op }) => {
      return observable((observer) => {
        const listeners: (() => void)[] = [];

        const { id, type, path } = op;

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const input = runtime.transformer.serialize(op.input);

          const onDisconnect = () => {
            observer.error(new TRPCClientError('Port disconnected prematurely'));
          };

          methods.addCloseListener(onDisconnect);
          listeners.push(() => methods.removeCloseListener(onDisconnect));

          const onMessage = (message: unknown) => {
            if (!isTRPCResponse(message)) return;
            const { trpc } = message;
            if (id !== trpc.id) return;

            if ('error' in trpc) {
              return observer.error(TRPCClientError.from(trpc));
            }

            observer.next({
              result: {
                ...trpc.result,
                ...((!trpc.result.type || trpc.result.type === 'data') && {
                  type: 'data',
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  data: runtime.transformer.deserialize(trpc.result.data),
                }),
              },
            } as OperationResultEnvelope<TRouter>);

            if (type !== 'subscription' || trpc.result.type === 'stopped') {
              observer.complete();
            }
          };

          methods.addMessageListener(onMessage);
          listeners.push(() => methods.removeMessageListener(onMessage));

          methods.postMessage({
            trpc: {
              id,
              jsonrpc: undefined,
              method: type,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              params: { path, input },
            },
          } as TRPCChromeRequest);
        } catch (cause) {
          observer.error(
            new TRPCClientError(cause instanceof Error ? cause.message : 'Unknown error')
          );
        }

        return () => {
          if (type === 'subscription') {
            methods.postMessage({
              trpc: {
                id,
                jsonrpc: undefined,
                method: 'subscription.stop',
              },
            } as TRPCChromeRequest);
          }
          listeners.forEach((unsub) => unsub());
        };
      });
    };
  };
};
