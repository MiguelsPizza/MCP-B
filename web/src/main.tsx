import { StrictMode } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import './globals.css';
import './index.css';
import { router } from './lib/router';
import { initializeMcpServer } from './services/MCP.ts';

// Initialize MCP server
initializeMcpServer();

// Create root and render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
