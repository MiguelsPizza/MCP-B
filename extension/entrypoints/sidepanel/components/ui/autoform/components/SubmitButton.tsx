import type React from 'react';
import { Button } from '../../button';

export const SubmitButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Button type="submit" size="sm" className="w-full h-8 text-[10px]">
    {children}
  </Button>
);
