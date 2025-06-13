import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Assistant } from '../components/Assistant';
import { indexSearchSchema } from '../paramSchemas';

export const Route = createFileRoute('/')({
  validateSearch: zodValidator(indexSearchSchema),
  component: IndexRoute,
});

function IndexRoute() {
  return <Assistant />;
}
