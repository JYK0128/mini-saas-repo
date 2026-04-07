import { FieldSet } from '@/components/ui/field';

function FormFieldSet({ children, ...props }: Readonly<React.ComponentProps<'fieldset'>>) {
  return (
    <FieldSet {...props}>
      {children}
    </FieldSet>
  );
}

FormFieldSet.displayName = 'FormFieldSet';

export default FormFieldSet;
