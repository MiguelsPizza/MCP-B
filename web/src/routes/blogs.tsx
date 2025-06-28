import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
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
    <McpClientProvider client={BlogPostClient} transport={BlogPostTransport}>
      <div className="min-h-screen relative">
        <div className="absolute top-20 left-10 h-72 w-72 bg-gradient-to-br from-primary/30 to-blue-600/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-gradient-to-br from-blue-600/20 to-primary/20 rounded-full blur-3xl animate-float-delayed" />

        <PageHeader
          title="Blog"
          description="Read our latest articles and insights"
          titleClassName="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          descriptionClassName="text-muted-foreground"
        />
        <div className="flex h-[calc(100vh-65px)]">
          <div className="flex-1 overflow-auto">
            <BlogPost />
          </div>
          <div className="w-96 border-l bg-gradient-to-b from-background to-background/80">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="mb-4 text-xl font-bold sm:text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Tasks
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <Todos route="/blogs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </McpClientProvider>
  );
}
