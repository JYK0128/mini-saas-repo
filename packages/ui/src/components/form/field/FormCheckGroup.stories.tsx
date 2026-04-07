import type { Meta, StoryObj } from '@storybook/react-vite';
import z from 'zod';

import { useAppForm } from '../context';
import FormCheckGroup, { type FormCheckGroupProps } from './FormCheckGroup';

const meta: Meta<typeof FormCheckGroup> = {
  title: 'Form/FormCheckGroup',
  component: FormCheckGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
      { label: 'Durian', value: 'durian', disabled: true },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof FormCheckGroup>;

/**
 * Storybook Template using useAppForm for full control over the form state.
 */
const schema = z.object({
  fruits: z.array(z.string()).min(1, 'Select at least one fruit'),
}).default({
  fruits: ['apple'],
});

function FormTemplate(args: Readonly<FormCheckGroupProps>) {
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
          <form.FieldLegend>Food Preferences</form.FieldLegend>
          <form.FieldDescription>Select your favorite fruits</form.FieldDescription>
          <form.FieldGroup>
            <form.AppField name="fruits">
              {({ CheckGroup }) => (
                <CheckGroup
                  label="Select Fruits"
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
