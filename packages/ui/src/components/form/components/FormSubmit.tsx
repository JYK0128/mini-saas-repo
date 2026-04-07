import { Button } from '@/components/ui/button';

import { useFormContext } from '../context';

function FormSubmit(props: Readonly<React.ComponentProps<'button'>>) {
  const form = useFormContext();
  const { canSubmit, isSubmitting } = form.state;

  return (
    <Button {...props} type="submit" disabled={!canSubmit || isSubmitting} />
  );
}

FormSubmit.displayName = 'FormSubmit';

export default FormSubmit;
