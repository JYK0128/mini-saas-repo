import * as React from 'react';

import { Field,
         FieldContent,
         FieldDescription,
         FieldError,
         FieldLabel } from '@/components/ui/field';
import { Select,
         SelectContent,
         SelectItem,
         SelectTrigger,
         SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { useFormField } from '../use-form-field';

export interface FormSelectItem {
  label: React.ReactNode
  value: string
  disabled?: boolean
}

export interface FormSelectProps extends React.ComponentProps<typeof SelectTrigger> {
  label?: React.ReactNode
  description?: React.ReactNode
  labelWidth?: React.CSSProperties['width']
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  required?: boolean
  items: FormSelectItem[]
  placeholder?: string
}

/** 단일 선택 (TanStack Form 기반) */
function FormSelect({
  label,
  description,
  labelWidth = 'auto',
  orientation = 'horizontal',
  showError = true,
  required = false,
  className,
  items,
  placeholder,
  ref,
  ...triggerProps
}: Readonly<FormSelectProps>) {
  const { field, hasError, errors } = useFormField<string>();

  return (
    <Field
      orientation={orientation}
      data-invalid={hasError}
      className={cn(className, 'min-h-fit min-w-fit')}
    >
      {label && (
        <div style={{ width: labelWidth }} className="flex items-center cursor-default select-none">
          <FieldLabel
            htmlFor={field.name}
          >
            {label}
            {required && <sup className="text-red-600"> *</sup>}
          </FieldLabel>
        </div>
      )}
      <FieldContent className="flex-1">
        <Select
          value={field.state.value}
          onValueChange={(v) => {
            field.handleChange(v);
          }}
          disabled={triggerProps.disabled}
        >
          <SelectTrigger
            {...triggerProps}
            ref={ref}
            id={field.name}
            aria-invalid={hasError}
            onBlur={(e) => {
              triggerProps.onBlur?.(e);
              field.handleBlur();
            }}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper">
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

FormSelect.displayName = 'FormSelect';

export default FormSelect;
