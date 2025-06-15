import { McpProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import BlogPost from '../components/BlogPost';
import { PageHeader } from '../components/PageHeader';
import Todos from '../components/Todos';
import { todoSortSchema } from '../paramSchemas';
import { BlogPostClient, BlogPostTransport } from '../services/MCP';

export const Route = createFileRoute('/blogs')({
  component: RouteComponent,
  validateSearch: zodValidator(todoSortSchema),
});

function RouteComponent() {
  return (
    <McpProvider client={BlogPostClient} transport={BlogPostTransport}>
      <div className="min-h-screen">
        <PageHeader title="Blog" description="Read our latest articles and insights" />
        <div className="flex h-[calc(100vh-65px)]">
          <div className="flex-1 overflow-auto">
            <BlogPost />
          </div>
          <div className="w-96 border-l bg-gradient-to-b from-background to-background/80">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg">Tasks</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <Todos route="/blogs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </McpProvider>
  );
}
