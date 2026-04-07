import type { Meta, StoryObj } from '@storybook/react-vite';
import z from 'zod';

import { useAppForm } from '../context';
import FormCheckbox, { type FormCheckboxProps } from './FormCheckbox';

const meta: Meta<typeof FormCheckbox> = {
  title: 'Form/FormCheckbox',
  component: FormCheckbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FormCheckbox>;

/**
 * Storybook Template using useAppForm for full control over the form state.
 */
const schema = z.object({
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  notifications: z.boolean(),
}).default({
  terms: false,
  notifications: true,
});

function FormTemplate(args: Readonly<FormCheckboxProps>) {
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
          <form.FieldLegend>Settings</form.FieldLegend>
          <form.FieldDescription>Manage your preferences</form.FieldDescription>
          <form.FieldGroup>
            <form.AppField name="terms">
              {({ Checkbox }) => (
                <Checkbox
                  label="I accept the terms and conditions"
                  description="Please read before accepting."
                  {...args}
                />
              )}
            </form.AppField>

            <form.AppField name="notifications">
              {({ Checkbox }) => (
                <Checkbox
                  label="Notify me about new updates"
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
