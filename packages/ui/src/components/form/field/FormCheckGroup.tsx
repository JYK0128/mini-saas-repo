import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Field,
         FieldContent,
         FieldError,
         FieldGroup,
         FieldLabel,
         FieldLegend } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { useFormField } from '../use-form-field';

export interface CheckItem {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
}

export interface FormCheckGroupProps extends React.ComponentProps<'div'> {
  items: CheckItem[]
  label?: React.ReactNode
  description?: React.ReactNode
  labelWidth?: React.CSSProperties['width']
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  required?: boolean
}

/** 체크박스 그룹 (TanStack Form 기반) */
function FormCheckGroup({
  items,
  label,
  description,
  labelWidth = 'auto',
  orientation = 'horizontal',
  showError = true,
  required = false,
  className,
  ref,
  ...restProps
}: Readonly<FormCheckGroupProps>) {
  const { field, hasError, errors } = useFormField<(string | number)[]>();

  const handleToggle = (itemValue: string | number, checked: boolean) => {
    const currentValue = field.state.value || [];
    const newValue = checked
      ? [...currentValue, itemValue]
      : currentValue.filter((v) => v !== itemValue);
    field.handleChange(newValue);
  };

  return (
    <Field
      orientation={orientation}
      data-invalid={hasError}
      className={cn(className, 'min-h-fit min-w-fit')}
      ref={ref}
      {...restProps}
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
        <FieldGroup
          className={cn(
            'flex gap-3',
            orientation === 'vertical' && 'flex-col',
            orientation === 'horizontal' && 'flex-row flex-wrap',
            orientation === 'responsive' && 'flex-col @md/field-group:flex-row @md/field-group:flex-wrap',
          )}
        >
          {items.map((item) => {
            const isChecked = (field.state.value || []).includes(item.value);
            return (
              <div key={item.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.name}-${item.value}`}
                  checked={isChecked}
                  disabled={item.disabled}
                  onCheckedChange={(checked) => handleToggle(item.value, !!checked)}
                  onBlur={(e) => {
                    restProps.onBlur?.(e as unknown as React.FocusEvent<HTMLDivElement>);
                    field.handleBlur();
                  }}
                />
                <FieldLabel
                  htmlFor={`${field.name}-${item.value}`}
                  className={cn('cursor-pointer', item.disabled && 'opacity-50 cursor-not-allowed')}
                >
                  {item.label}
                </FieldLabel>
              </div>
            );
          })}
        </FieldGroup>

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

FormCheckGroup.displayName = 'FormCheckGroup';

export default FormCheckGroup;
