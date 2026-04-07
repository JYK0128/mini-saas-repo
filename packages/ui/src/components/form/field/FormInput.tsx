import * as React from 'react';

import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useFormField } from '../use-form-field';

export interface FormInputProps extends React.ComponentProps<typeof Input> {
  label?: React.ReactNode
  description?: React.ReactNode
  labelWidth?: React.CSSProperties['width']
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  required?: boolean
  leftSide?: React.ReactNode
  rightSide?: React.ReactNode
}

/** 단순 텍스트 입력 (TanStack Form 기반) */
function FormInput({
  label,
  description,
  labelWidth = 'auto',
  orientation = 'horizontal',
  showError = true,
  required = false,
  leftSide,
  rightSide,
  className,
  ref,
  ...inputProps
}: Readonly<FormInputProps>) {
  const {
    field,
    errors,
    hasError,
  } = useFormField<string | number | readonly string[]>();

  return (
    <Field
      orientation={orientation}
      data-invalid={hasError}
      className={cn(className, 'min-h-fit min-w-fit')}
    >
      {label && (
        <div style={{ width: labelWidth }} className="flex items-start cursor-default select-none">
          <FieldLabel
            htmlFor={field.name}
          >
            {label}
            {required && <sup className="text-red-600"> *</sup>}
          </FieldLabel>
        </div>
      )}
      <FieldContent className="flex-1">
        <div className="flex gap-2">
          {leftSide}
          <Input
            {...inputProps}
            ref={ref}
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={(e) => {
              inputProps.onBlur?.(e);
              field.handleBlur();
            }}
            onChange={(e) => {
              inputProps.onChange?.(e);
              field.handleChange(
                (inputProps.type === 'number'
                  ? e.target.valueAsNumber
                  : e.target.value),
              );
            }}
            aria-invalid={hasError}
          />
          {rightSide}
        </div>
        {description && (
          <FieldDescription>{description}</FieldDescription>
        )}
        {showError && hasError && (
          <FieldError
            errors={errors.map((err: { message?: string } | string) => ({
              message: typeof err === 'string' ? err : err.message || 'Error',
            }))}
          />
        )}
      </FieldContent>
    </Field>
  );
}

FormInput.displayName = 'FormInput';

export default FormInput;
