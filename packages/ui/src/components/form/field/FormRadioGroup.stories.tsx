import type { Meta, StoryObj } from '@storybook/react-vite';
import z from 'zod';

import { useAppForm } from '../context';
import FormRadioGroup, { type FormRadioGroupProps } from './FormRadioGroup';

const meta: Meta<typeof FormRadioGroup> = {
  title: 'Form/FormRadioGroup',
  component: FormRadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Angular', value: 'angular' },
      { label: 'Svelte', value: 'svelte' },
      { label: 'Next.js', value: 'nextjs', disabled: true },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof FormRadioGroup>;

/**
 * Storybook Template using useAppForm for full control over the form state.
 */
const schema = z.object({
  framework: z.string().min(1, 'Select a framework'),
}).default({
  framework: 'react',
});

function FormTemplate(args: Readonly<FormRadioGroupProps>) {
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
          <form.FieldLegend>Development</form.FieldLegend>
          <form.FieldDescription>Select your framework</form.FieldDescription>
          <form.FieldGroup>
            <form.AppField name="framework">
              {({ RadioGroup }) => (
                <RadioGroup
                  label="Select Framework"
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
