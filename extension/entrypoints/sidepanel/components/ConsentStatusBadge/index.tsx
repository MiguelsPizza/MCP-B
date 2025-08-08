import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface ConsentDecision {
  domain: string;
  granted: boolean;
  timestamp: number;
  permanent: boolean;
}

export interface ConsentStatusBadgeProps {
  domain: string;
  consentDecisions: Record<string, ConsentDecision>;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * ConsentStatusBadge - Visual indicator for MCP consent status
 *
 * Shows current consent status for a domain with appropriate styling:
 * - "Always Allowed" (blue) for permanent consent
 * - "Session" (default) for temporary consent
 * - "Denied" (destructive) for denied consent
 * - "No Decision" (outline) for domains with no consent decision
 */
export const ConsentStatusBadge: React.FC<ConsentStatusBadgeProps> = ({
  domain,
  consentDecisions,
  className,
  size = 'sm',
}) => {
  const decision = consentDecisions[domain];

  if (!decision) {
    return (
      <Badge
        variant="outline"
        className={cn(size === 'sm' ? 'text-xs h-4' : 'text-sm h-5', className)}
      >
        No Decision
      </Badge>
    );
  }

  return (
    <Badge
      variant={decision.granted ? 'default' : 'destructive'}
      className={cn(
        size === 'sm' ? 'text-xs h-4' : 'text-sm h-5',
        decision.permanent && decision.granted && 'bg-blue-500 hover:bg-blue-600 text-white',
        className
      )}
    >
      {decision.granted ? (decision.permanent ? 'Always Allowed' : 'Session') : 'Denied'}
    </Badge>
  );
};

export default ConsentStatusBadge;
