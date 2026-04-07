import { FieldLegend } from '@/components/ui/field';

function FormFieldLegend({ children, ...props }: Readonly<React.ComponentProps<'legend'>>) {
  return (
    <FieldLegend {...props}>
      {children}
    </FieldLegend>
  );
}

FormFieldLegend.displayName = 'FormFieldLegend';

export default FormFieldLegend;
