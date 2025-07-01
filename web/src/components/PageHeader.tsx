import { Link } from '@tanstack/react-router';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const PageHeader = ({
  title,
  description,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) => {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <Link to="/" className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className={`text-base sm:text-lg font-semibold truncate ${titleClassName || ''}`}>
                {title}
              </h1>
              {description && (
                <p
                  className={`text-xs sm:text-sm text-muted-foreground truncate ${descriptionClassName || ''}`}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          <Link to="/" className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
