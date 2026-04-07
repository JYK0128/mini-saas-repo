import type { Meta, StoryObj } from '@storybook/react-vite';
import z from 'zod';

import { Button } from '@/components/ui';

import { useAppForm } from '../context';
import FormInput, { type FormInputProps } from './FormInput';

const meta: Meta<typeof FormInput> = {
  title: 'Form/FormInput',
  component: FormInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FormInput>;

/**
 * Storybook Template using useAppForm for full control over the form state.
 */
const schema = z.object({
  username: z.string(),
  email: z.email(),
}).default({
  username: '',
  email: '',
});
function FormTemplate(args: Readonly<FormInputProps>) {
  const form = useAppForm({
    defaultValues: schema.def.defaultValue,
    validators: {
      onSubmit: schema.unwrap(),
    },
    onSubmitInvalid: ({ value, formApi }) => {
      console.error('Submitted invalid values:', value, formApi.getAllErrors().form.errors);
    },
    onSubmit: ({ value }) => {
      console.log('Submitted values:', value);
    },
  });

  return (
    <form.AppForm>
      <form.Layout
        className="w-100 flex flex-col gap-6"
        onSubmit={() => void form.handleSubmit()}
      >
        <form.FieldSet>
          <form.FieldLegend>User Information</form.FieldLegend>
          <form.FieldDescription>Enter your information</form.FieldDescription>
          <form.FieldGroup>
            <form.AppField name="username">
              {({ Input }) => (
                <Input
                  label="Username"
                  placeholder="Enter your username"
                  {...args}
                />
              )}
            </form.AppField>
            <form.AppField name="email">
              {({ Input }) => (
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  description="We will never share your email."
                  rightSide={<Button>Check</Button>}
                  {...args}
                />
              )}
            </form.AppField>
          </form.FieldGroup>
        </form.FieldSet>

        <form.Reset>Reset</form.Reset>
        <form.Submit>Submit</form.Submit>
      </form.Layout>
    </form.AppForm>
  );
}

export const Vertical: Story = {
  render: (args) => <FormTemplate {...args} orientation="vertical" />,
};

export const Horizontal: Story = {
  render: (args) => <FormTemplate {...args} orientation="horizontal" labelWidth={150} />,
};

export const Required: Story = {
  render: (args) => <FormTemplate {...args} required />,
};
