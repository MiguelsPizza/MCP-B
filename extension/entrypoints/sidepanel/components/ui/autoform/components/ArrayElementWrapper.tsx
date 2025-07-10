import type { ArrayElementWrapperProps } from '@autoform/react';
import { TrashIcon } from 'lucide-react';
import type React from 'react';
import { Button } from '../../button';

export const ArrayElementWrapper: React.FC<ArrayElementWrapperProps> = ({ children, onRemove }) => {
  return (
    <div className="relative border p-2 sm:p-3 rounded-md mt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div className="flex-grow">{children}</div>
      <Button
        onClick={onRemove}
        variant="ghost"
        size="icon"
        className="h-6 w-6 sm:absolute sm:top-1 sm:right-1 flex-shrink-0"
        type="button"
      >
        <TrashIcon className="h-3 w-3" />
      </Button>
    </div>
  );
};
