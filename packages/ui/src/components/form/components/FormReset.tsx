import { Button } from '@/components/ui/button';

import { useFormContext } from '../context';

function FormReset({ children, ...props }: Readonly<React.ComponentProps<'button'>>) {
  const form = useFormContext();

  return (
    <Button
      {...props}
      type="reset"
      onClick={() => form.reset()}
    >
      {children}
    </Button>
  );
}

FormReset.displayName = 'FormReset';

export default FormReset;
