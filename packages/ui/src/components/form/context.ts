import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { lazy } from 'react';

export const { fieldContext, useFieldContext, formContext, useFormContext }
  = createFormHookContexts();

const Layout = lazy(() => import('./components/FormLayout'));
const Submit = lazy(() => import('./components/FormSubmit'));
const Reset = lazy(() => import('./components/FormReset'));
const FieldSet = lazy(() => import('./components/FormFieldSet'));
const FieldLegend = lazy(() => import('./components/FormFieldLegend'));
const FieldDescription = lazy(() => import('./components/FormFieldDescription'));
const FieldGroup = lazy(() => import('./components/FormFieldGroup'));

const Input = lazy(() => import('./field/FormInput'));
const Select = lazy(() => import('./field/FormSelect'));
const Checkbox = lazy(() => import('./field/FormCheckbox'));
const CheckGroup = lazy(() => import('./field/FormCheckGroup'));
const RadioGroup = lazy(() => import('./field/FormRadioGroup'));
const Textarea = lazy(() => import('./field/FormTextarea'));

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Input,
    Select,
    Checkbox,
    CheckGroup,
    RadioGroup,
    Textarea,
  },
  formComponents: {
    Layout,
    Submit,
    Reset,
    FieldSet,
    FieldLegend,
    FieldDescription,
    FieldGroup,
  },
  fieldContext,
  formContext,
});
