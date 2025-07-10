import type { ArrayWrapperProps } from '@autoform/react';
import { PlusIcon } from 'lucide-react';
import type React from 'react';
import { Button } from '../../button';

export const ArrayWrapper: React.FC<ArrayWrapperProps> = ({ label, children, onAddItem }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">{label}</h3>
      {children}
      <Button onClick={onAddItem} variant="outline" size="sm" type="button" className="h-7 px-2.5">
        <PlusIcon className="h-3.5 w-3.5" />
        <span className="text-xs">Add Item</span>
      </Button>
    </div>
  );
};
