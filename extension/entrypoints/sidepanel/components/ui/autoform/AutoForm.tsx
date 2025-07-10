import { type AutoFormUIComponents, AutoForm as BaseAutoForm } from '@autoform/react';
import type React from 'react';
import { ArrayElementWrapper } from './components/ArrayElementWrapper';
import { ArrayWrapper } from './components/ArrayWrapper';
import { BooleanField } from './components/BooleanField';
import { DateField } from './components/DateField';
import { ErrorMessage } from './components/ErrorMessage';
import { FieldWrapper } from './components/FieldWrapper';
import { Form } from './components/Form';
import { NumberField } from './components/NumberField';
import { ObjectWrapper } from './components/ObjectWrapper';
import { SelectField } from './components/SelectField';
import { StringField } from './components/StringField';
import { SubmitButton } from './components/SubmitButton';
import type { AutoFormProps } from './types';

const ShadcnUIComponents: AutoFormUIComponents = {
  Form,
  FieldWrapper,
  ErrorMessage,
  SubmitButton,
  ObjectWrapper,
  ArrayWrapper,
  ArrayElementWrapper,
};

export const ShadcnAutoFormFieldComponents = {
  string: StringField,
  number: NumberField,
  boolean: BooleanField,
  date: DateField,
  select: SelectField,
} as const;
export type FieldTypes = keyof typeof ShadcnAutoFormFieldComponents;

export function AutoForm<T extends Record<string, any>>({
  uiComponents,
  formComponents,
  ...props
}: AutoFormProps<T>): React.ReactElement {
  return (
    <BaseAutoForm
      {...props}
      uiComponents={{ ...ShadcnUIComponents, ...uiComponents }}
      formComponents={{ ...ShadcnAutoFormFieldComponents, ...formComponents }}
    />
  );
}
