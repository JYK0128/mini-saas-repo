---
name: tanstack-form-zod-builder
description: Standardize form logic and validation using TanStack Form and Zod. This skill provides templates for useForm with zodValidator and field rendering patterns.
---

# TanStack Form + Zod Builder Guide

Use this skill to build complex forms with validation in the `admin-web` project.

## 1. Form Initialization

Use `useAppForm` from `@repo/ui/components/form/context`. It internally uses TanStack Form with `zodValidator`.

```typescript
import { useAppForm } from '@repo/ui/components/form/context';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

function MyForm() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      // Submitting logic here
      console.log(value);
    },
  });

  return (
    <form.AppForm>
      <form.Layout onSubmit={() => void form.handleSubmit()}>
        <form.FieldSet>
          {/* Form Fields */}
        </form.FieldSet>
      </form.Layout>
    </form.AppForm>
  );
}
```

## 2. Reusable Field Pattern

Use `form.AppField` to wrap input components. It provides a pre-configured `Input` component that handles labels, placeholders, and error messages automatically.

```typescript
<form.AppField name="name">
  {({ Input }) => (
    <Input
      label="이름"
      placeholder="홍길동"
      orientation="vertical"
      showError
    />
  )}
</form.AppField>
```

## 3. Handling API Mutations

Integrate with generated TanStack Query mutations (from `api-client-sync`).

```typescript
const mutation = useCreateItemMutation();

const form = useAppForm({
  onSubmit: async ({ value }) => {
    // Manual toast calls are NOT required as they are handled globally.
    await mutation.mutateAsync({ data: value });
  },
});
```

---

## 4. Submission & Loading State

Use `form.Submit` for the submit button. It automatically integrates with the form's submission state.

```typescript
<form.Submit className="w-full">
  저장하기
</form.Submit>
```

---

## 5. UI Layout

- **Spacing**: Prefer `flex flex-col gap-6` or `grid gap-6` over `space-y-6` for better layout predictability and to avoid margin-collapse issues.
- **Labels**: Use semantic `<label>` and `htmlFor`.

## 6. Type Safety

When defining types for forms, API responses, or component props, **do not use `any`**. Instead, import the generated TypeScript interfaces from the `@/api/model` directory (produced by the project's overload/type generation step). For example:

```typescript
import type { UserResponseDto } from '@/api/model';
```

Use these concrete types for form schemas, mutation payloads, and loader data to ensure full type safety and IDE autocompletion.
