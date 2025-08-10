// Import the generated route tree
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import { trpc, trpcClient } from './lib/trpc_client';
import { queryClient } from './lib/trpc_client.ts';
import { routeTree } from './routeTree.gen.ts';

const memoryHistory = createMemoryHistory({
  initialEntries: ['/'], // Pass your initial URL
});

// Create a new router instance
const router = createRouter({
  routeTree,
  history: memoryHistory,
});
// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
