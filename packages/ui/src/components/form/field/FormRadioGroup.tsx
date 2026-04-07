import * as React from 'react';

import { Field,
         FieldContent,
         FieldError,
         FieldLabel,
         FieldLegend } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

import { useFormField } from '../use-form-field';

export interface RadioItem {
  label: React.ReactNode
  value: string | number
  disabled?: boolean
}

export interface FormRadioGroupProps {
  items: RadioItem[]
  label?: React.ReactNode
  description?: React.ReactNode
  labelWidth?: React.CSSProperties['width']
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  required?: boolean
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  style?: React.CSSProperties
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

/** 라디오 그룹 (TanStack Form 기반) */
function FormRadioGroup({
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
}: Readonly<FormRadioGroupProps>) {
  const { field, hasError, errors } = useFormField<string | number>();

  return (
    <Field
      orientation={orientation}
      data-invalid={hasError}
      className={cn(className, 'min-h-fit min-w-fit')}
      ref={ref}
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
        <RadioGroup
          name={field.name}
          value={String(field.state.value ?? '')}
          onValueChange={(value) => field.handleChange(value)}
          onBlur={() => field.handleBlur()}
          className={cn(
            'flex gap-3',
            orientation === 'vertical' && 'flex-col',
            orientation === 'horizontal' && 'flex-row flex-wrap',
            orientation === 'responsive' && 'flex-col @md/field-group:flex-row @md/field-group:flex-wrap',
          )}
          {...restProps}
        >
          {items.map((item) => {
            const itemId = `${field.name}-${item.value}`;
            return (
              <div key={item.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={String(item.value)}
                  id={itemId}
                  disabled={item.disabled}
                />
                <FieldLabel
                  htmlFor={itemId}
                  className={cn('cursor-pointer', item.disabled && 'opacity-50 cursor-not-allowed')}
                >
                  {item.label}
                </FieldLabel>
              </div>
            );
          })}
        </RadioGroup>

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

FormRadioGroup.displayName = 'FormRadioGroup';

export default FormRadioGroup;
