import { initTRPC } from '@trpc/server';

export const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
});
