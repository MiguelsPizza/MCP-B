import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { Documentation } from '../components/Documentation';
import { PageHeader } from '../components/PageHeader';

const MOBILE_BREAKPOINT = 1000;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initialize with actual value on first render
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    setIsMobile(mql.matches);

    // Add listener
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export const Route = createFileRoute('/docs')({
  component: DocumentationRoute,
});

function DocumentationRoute() {
  const isMobile = useIsMobile();

  // Debug log
  console.log('isMobile:', isMobile, 'window.innerWidth:', window.innerWidth);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-x-hidden">
        {!isMobile && (
          <>
            <div className="absolute top-20 left-10 h-72 w-72 bg-gradient-to-br from-primary/30 to-blue-600/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-20 right-10 h-96 w-96 bg-gradient-to-br from-blue-600/20 to-primary/20 rounded-full blur-3xl animate-float-delayed" />
          </>
        )}
        <PageHeader
          title="Documentation"
          description="Comprehensive guides and API references"
          titleClassName="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          descriptionClassName="text-muted-foreground"
        />
      </div>
      <Documentation isMobile={isMobile} />
    </div>
  );
}
