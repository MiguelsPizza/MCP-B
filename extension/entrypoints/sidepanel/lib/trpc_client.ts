import type { BGSWRouterType } from '@/entrypoints/background/src/routers';
import { chromeLink } from '@/entrypoints/background/trpc-browser/link';
import { QueryClient } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';

type TRPCReactInstance = ReturnType<typeof createTRPCReact<BGSWRouterType>>;
export const trpc: TRPCReactInstance = createTRPCReact<BGSWRouterType>();

/**
 * Chrome runtime port connection to the background script
 * Used for communication between the popup and background script
 */
export const port = chrome.runtime.connect({ name: 'BGSW' });

/**
 * React Query client instance for managing server state and caching
 * Handles data fetching, caching, and synchronization
 */
export const queryClient = new QueryClient();

/**
 * Configured tRPC client instance with Chrome message port transport
 * Uses chromeLink to enable communication through Chrome runtime messaging
 */
export const trpcClient = trpc.createClient({
  links: [chromeLink({ port })],
});
