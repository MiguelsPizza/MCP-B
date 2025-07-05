import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import './index.css';
import { router } from './lib/router';
import { server, transport } from './TabServer';

// Initialize MCP server
// initializeMcpServer();

server.connect(transport);

// Create root and render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
