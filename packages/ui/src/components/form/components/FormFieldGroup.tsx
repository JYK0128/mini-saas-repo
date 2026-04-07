import { FieldGroup } from '@/components/ui/field';

function FormFieldGroup({ children, ...props }: Readonly<React.ComponentProps<'div'>>) {
  return (
    <FieldGroup {...props}>
      {children}
    </FieldGroup>
  );
}

FormFieldGroup.displayName = 'FormFieldGroup';

export default FormFieldGroup;
