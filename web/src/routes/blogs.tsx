import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Menu, X } from 'lucide-react';
import BlogPost from '../components/BlogPost';
import { PageHeader } from '../components/PageHeader';
import Todos from '../components/Todos';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { blogSearchSchema } from '../paramSchemas';
import { BlogPostClient, BlogPostTransport } from '../services/MCP';
import { useIsMobile } from './docs';

export const Route = createFileRoute('/blogs')({
  component: RouteComponent,
  validateSearch: zodValidator(blogSearchSchema),
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isMobile = useIsMobile();
  const showTodos = search.showTodos ?? false;

  const toggleTodos = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        showTodos: !showTodos,
      }),
    });
  };

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

        {/* Mobile & Desktop Toggle Button */}
        <div className="fixed bottom-6 right-6 z-50 md:top-6 md:bottom-auto">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTodos} 
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            {showTodos ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex">
          <div className="flex-1 px-4 sm:px-6 md:px-8 pb-20 md:pb-8">
            <BlogPost />
          </div>

          {/* Desktop Sidebar */}
          {!isMobile && showTodos && (
            <div className="w-96 border-l bg-gradient-to-b from-background to-background/80 flex-shrink-0">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold sm:text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Tasks
                </h2>
              </div>
              <div className="p-4">
                <Todos route="/blogs" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sheet */}
        {isMobile && (
          <Sheet open={showTodos} onOpenChange={toggleTodos}>
            <SheetContent className="w-[90vw] sm:w-[400px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Tasks
                </SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-80px)] overflow-auto p-4">
                <Todos route="/blogs" />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </McpClientProvider>
  );
}
