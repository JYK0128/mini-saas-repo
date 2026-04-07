import { useFormContext } from '../context';

function FormLayout({ children, ...props }: Readonly<React.ComponentProps<'form'>>) {
  const form = useFormContext();

  return (
    <form
      {...props}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!form.state.isSubmitting) {
          props.onSubmit?.(e);
        }
      }}
    >
      {children}
    </form>
  );
}

FormLayout.displayName = 'FormLayout';

export default FormLayout;
