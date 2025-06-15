import { createFileRoute } from '@tanstack/react-router';
import { Documentation } from '../components/Documentation';
import { PageHeader } from '../components/PageHeader';

export const Route = createFileRoute('/docs')({
  component: DocumentationRoute,
});

function DocumentationRoute() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Documentation" description="Comprehensive guides and API references" />
      <Documentation />
    </div>
  );
}
