import type { ObjectWrapperProps } from '@autoform/react';
import type React from 'react';

export const ObjectWrapper: React.FC<ObjectWrapperProps> = ({ label, children }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">{label}</h3>
      {children}
    </div>
  );
};
