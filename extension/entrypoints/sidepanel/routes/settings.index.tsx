import { createFileRoute } from '@tanstack/react-router';
import ConsentSettings from '../components/ConsentSettings';

const ConsentRoute = () => {
  return (
    <div className="h-screen">
      <ConsentSettings />
    </div>
  );
};

export const Route = createFileRoute('/settings/')({
  component: ConsentRoute,
});
