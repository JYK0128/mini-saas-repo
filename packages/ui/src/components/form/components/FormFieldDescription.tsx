import { FieldDescription } from '@/components/ui/field';

function FormFieldDescription({ children, ...props }: Readonly<React.ComponentProps<'p'>>) {
  return (
    <FieldDescription {...props}>
      {children}
    </FieldDescription>
  );
}

FormFieldDescription.displayName = 'FormFieldDescription';

export default FormFieldDescription;
