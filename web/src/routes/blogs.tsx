import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import BlogPost from '../components/BlogPost';
import { PageHeader } from '../components/PageHeader';
import { blogSearchSchema } from '../paramSchemas';
import { BlogPostClient, BlogPostTransport } from '../services/MCP';

export const Route = createFileRoute('/blogs')({
  component: RouteComponent,
  validateSearch: zodValidator(blogSearchSchema),
});

function RouteComponent() {
  return (
    <McpClientProvider client={BlogPostClient} transport={BlogPostTransport}>
      <div className="min-h-screen relative overflow-x-hidden">
        <div className="absolute top-20 left-10 h-48 w-48 sm:h-64 sm:w-64 lg:h-72 lg:w-72 bg-gradient-to-br from-primary/20 sm:from-primary/25 lg:from-primary/30 to-blue-600/20 sm:to-blue-600/25 lg:to-blue-600/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96 bg-gradient-to-br from-blue-600/15 sm:from-blue-600/20 to-primary/15 sm:to-primary/20 rounded-full blur-3xl animate-float-delayed" />

        <PageHeader
          title="Blog"
          description="Read our latest articles and insights"
          titleClassName="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          descriptionClassName="text-muted-foreground"
        />

        <div className="flex">
          <BlogPost />
        </div>
      </div>
    </McpClientProvider>
  );
}
