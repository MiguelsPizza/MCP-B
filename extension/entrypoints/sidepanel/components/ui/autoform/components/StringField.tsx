import type { AutoFormFieldProps } from '@autoform/react';
import type React from 'react';
import { Input } from '../../input';

export const StringField: React.FC<AutoFormFieldProps> = ({ inputProps, error, id }) => {
  const { key, ...props } = inputProps;

  return (
    <Input id={id} className={`h-8 text-[10px] ${error ? 'border-destructive' : ''}`} {...props} />
  );
};
