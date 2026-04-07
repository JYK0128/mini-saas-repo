import * as React from 'react';

import { Field,
         FieldContent,
         FieldError,
         FieldLegend } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useFormField } from '../use-form-field';

export interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  label?: React.ReactNode
  description?: React.ReactNode
  labelWidth?: React.CSSProperties['width']
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  required?: boolean
}

/** 텍스트 영역 입력 (TanStack Form 기반) */
function FormTextarea({
  label,
  description,
  labelWidth = 'auto',
  orientation = 'horizontal',
  showError = true,
  required = false,
  className,
  ref,
  ...textareaProps
}: Readonly<FormTextareaProps>) {
  const { field, hasError, errors } = useFormField<string>();

  return (
    <Field
      orientation={orientation}
      data-invalid={hasError}
      className={cn(className, 'min-h-fit min-w-fit')}
    >
      {label && (
        <div style={{ width: labelWidth }} className="flex items-start cursor-default select-none">
          <FieldLegend>
            {label}
            {required && <sup className="text-red-600"> *</sup>}
          </FieldLegend>
        </div>
      )}
      <FieldContent className="flex-1">
        <Textarea
          {...textareaProps}
          ref={ref}
          name={field.name}
          value={field.state.value ?? ''}
          onBlur={(e) => {
            textareaProps.onBlur?.(e);
            field.handleBlur();
          }}
          onChange={(e) => {
            textareaProps.onChange?.(e);
            field.handleChange(e.target.value);
          }}
          aria-invalid={hasError}
        />
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
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

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
