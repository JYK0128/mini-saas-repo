import type { Meta, StoryObj } from '@storybook/react-vite';
import z from 'zod';

import { useAppForm } from '../context';
import FormTextarea, { type FormTextareaProps } from './FormTextarea';

const meta: Meta<typeof FormTextarea> = {
  title: 'Form/FormTextarea',
  component: FormTextarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FormTextarea>;

/**
 * Storybook Template using useAppForm for full control over the form state.
 */
const schema = z.object({
  bio: z.string().min(1, 'Bio is required'),
}).default({
  bio: '',
});

function FormTemplate(args: Readonly<FormTextareaProps>) {
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
          <form.FieldLegend>Profile Information</form.FieldLegend>
          <form.FieldDescription>Enter your biography</form.FieldDescription>
          <form.FieldGroup>
            <form.AppField name="bio">
              {({ Textarea }) => (
                <Textarea
                  label="Bio"
                  placeholder="Tell us about yourself"
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
