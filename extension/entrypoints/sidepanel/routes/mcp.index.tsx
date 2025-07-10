import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute } from '@tanstack/react-router';
import McpServer from '@/entrypoints/sidepanel/components/McpServer';
import { client, transport } from '../lib/client';

const McpRoute = () => {
  return (
    <div className="h-screen">
      <McpClientProvider client={client} transport={transport} opts={{}}>
        <McpServer />
      </McpClientProvider>
    </div>
  );
};

export const Route = createFileRoute('/mcp/')({
  component: McpRoute,
});
