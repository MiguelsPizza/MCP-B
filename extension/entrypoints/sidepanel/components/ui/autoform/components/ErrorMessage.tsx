import { AlertCircle } from 'lucide-react';
import type React from 'react';
import { Alert, AlertTitle } from '../../alert';

export const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
  <Alert variant="destructive" className="py-2 px-3">
    <AlertCircle className="h-3.5 w-3.5" />
    <AlertTitle className="text-sm">{error}</AlertTitle>
  </Alert>
);
