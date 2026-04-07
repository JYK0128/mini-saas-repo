import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Field,
         FieldContent,
         FieldDescription,
         FieldError,
         FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { useFormField } from '../use-form-field';

export interface FormCheckboxProps extends React.ComponentProps<typeof Checkbox> {
  label?: React.ReactNode
  description?: React.ReactNode
  labelWidth?: React.CSSProperties['width']
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  required?: boolean
}

/** 단일 체크박스 (TanStack Form 기반) */
function FormCheckbox({
  label,
  description,
  labelWidth = 'auto',
  orientation = 'horizontal',
  showError = true,
  required = false,
  className,
  ref,
  ...checkboxProps
}: Readonly<FormCheckboxProps>) {
  const { field, hasError, errors } = useFormField<boolean | null | undefined>();

  return (
    <Field
      orientation={orientation}
      data-invalid={hasError}
      className={cn(className, 'min-h-fit min-w-fit')}
    >
      <FieldContent className="flex-1">
        <div
          className={cn(
            'flex gap-2',
            orientation === 'vertical' && 'flex-col',
            orientation === 'horizontal' && 'flex-row items-center',
            orientation === 'responsive' && 'flex-col @md/field:flex-row @md/field:items-center',
          )}
        >
          <div className="shrink-0">
            <Checkbox
              {...checkboxProps}
              ref={ref}
              id={field.name}
              checked={!!field.state.value}
              onCheckedChange={(checked) => {
                checkboxProps.onCheckedChange?.(checked);
                field.handleChange(!!checked);
              }}
              onBlur={(e) => {
                checkboxProps.onBlur?.(e);
                field.handleBlur();
              }}
              aria-invalid={hasError}
            />
          </div>
          {label && (
            <div style={{ width: orientation === 'horizontal' ? labelWidth : 'auto' }}>
              <FieldLabel
                htmlFor={field.name}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  checkboxProps.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {label}
                {required && <sup className="text-red-600"> *</sup>}
              </FieldLabel>
            </div>
          )}
        </div>
        {description && (
          <FieldDescription className={cn(label && orientation === 'horizontal' && 'ml-6')}>
            {description}
          </FieldDescription>
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

FormCheckbox.displayName = 'FormCheckbox';

export default FormCheckbox;
