import type { AutoFormFieldProps } from '@autoform/react';
import type React from 'react';
import { Checkbox } from '../../checkbox';
import { Label } from '../../label';

export const BooleanField: React.FC<AutoFormFieldProps> = ({ field, label, id, inputProps }) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={id}
      className="h-4 w-4"
      onCheckedChange={(checked: boolean) => {
        // react-hook-form expects an event object
        const event = {
          target: {
            name: field.key,
            value: checked,
          },
        };
        inputProps.onChange(event);
      }}
      required={false}
      checked={inputProps.value}
    />
    <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
      {label}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
  </div>
);
