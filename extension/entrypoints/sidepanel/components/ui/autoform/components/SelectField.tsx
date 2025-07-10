import type { AutoFormFieldProps } from '@autoform/react';
import type React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';

export const SelectField: React.FC<AutoFormFieldProps> = ({ field, inputProps, error, id }) => {
  const { key, ...props } = inputProps;

  return (
    <Select
      {...props}
      onValueChange={(value) => {
        const syntheticEvent = {
          target: {
            value,
            name: field.key,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(syntheticEvent);
      }}
      defaultValue={field.default}
    >
      <SelectTrigger id={id} className={`h-8 text-[10px] ${error ? 'border-destructive' : ''}`}>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent className="max-h-[200px]">
        {(field.options || []).map(([key, label]) => (
          <SelectItem key={key} value={key} className="text-sm">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
