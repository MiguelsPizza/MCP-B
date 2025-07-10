import type { FieldWrapperProps } from '@autoform/react';
import type React from 'react';
import { Label } from '../../label';

const DISABLED_LABELS = ['boolean', 'object', 'array'];

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  children,
  id,
  field,
  error,
}) => {
  const isDisabled = DISABLED_LABELS.includes(field.type);

  return (
    <div className="space-y-0.5">
      {!isDisabled && (
        <Label htmlFor={id} className="text-[10px]">
          {label}
          {field.required && <span className="text-destructive"> *</span>}
        </Label>
      )}
      {children}
      {field.fieldConfig?.description && (
        <p className="text-[9px] text-muted-foreground leading-tight">
          {field.fieldConfig.description}
        </p>
      )}
      {error && <p className="text-[9px] text-destructive">{error}</p>}
    </div>
  );
};
