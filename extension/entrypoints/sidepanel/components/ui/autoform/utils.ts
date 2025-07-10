import { buildZodFieldConfig } from '@autoform/react';
import type { FieldTypes } from './AutoForm';

export const fieldConfig = buildZodFieldConfig<
  FieldTypes,
  {
    // Add types for `customData` here.
  }
>() as any;
