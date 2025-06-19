import { createFileRoute } from '@tanstack/react-router';
import { Documentation } from '../components/Documentation';
import { PageHeader } from '../components/PageHeader';

export const Route = createFileRoute('/docs')({
  component: DocumentationRoute,
});

function DocumentationRoute() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute top-20 left-10 h-72 w-72 bg-gradient-to-br from-primary/30 to-blue-600/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-20 right-10 h-96 w-96 bg-gradient-to-br from-blue-600/20 to-primary/20 rounded-full blur-3xl animate-float-delayed" />
      <PageHeader
        title="Documentation"
        description="Comprehensive guides and API references"
        titleClassName="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
        descriptionClassName="text-muted-foreground"
      />
      <Documentation />
    </div>
  );
}
