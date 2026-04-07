import type { Meta, StoryObj } from '@storybook/react-vite';
import z from 'zod';

import { useAppForm } from '../context';
import FormSelect, { type FormSelectProps } from './FormSelect';

const meta: Meta<typeof FormSelect> = {
  title: 'Form/FormSelect',
  component: FormSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Blueberry', value: 'blueberry' },
      { label: 'Grapes', value: 'grapes', disabled: true },
      { label: 'Orange', value: 'orange' },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof FormSelect>;

/**
 * Storybook Template using useAppForm for full control over the form state.
 */
const schema = z.object({
  fruit: z.string().min(1, 'Please select a fruit'),
}).default({
  fruit: '',
});

function FormTemplate(args: Readonly<FormSelectProps>) {
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
          <form.FieldLegend>Product Information</form.FieldLegend>
          <form.FieldDescription>Select your preferences</form.FieldDescription>
          <form.FieldGroup>
            <form.AppField name="fruit">
              {({ Select }) => (
                <Select
                  label="Fruit"
                  placeholder="Select a fruit"
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
