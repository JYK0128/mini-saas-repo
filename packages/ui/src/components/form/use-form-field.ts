import { useFieldContext, useFormContext } from './context';

/**
 * TanStack Form 필드의 상태를 가져와서 에러 표시 여부 등을 처리하는 공통 훅
 */
export function useFormField<T>() {
  const field = useFieldContext<T>();
  const form = useFormContext();

  const { isTouched } = field.state.meta;
  const { isSubmitting, isSubmitted } = form.state;

  const errors = field.state.meta.errors;
  const hasError = errors.length > 0;

  return {
    field,
    form,
    isTouched,
    isSubmitting,
    isSubmitted,
    errors,
    hasError,
  };
}
