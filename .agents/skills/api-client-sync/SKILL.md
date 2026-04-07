---
name: api-client-sync
description: Synchronize the frontend API client (Orval) with the backend Swagger (NestJS). Use this skill when backend endpoints change or when implementing new API calls in the frontend.
---

# API Client Sync & Integration Guide

Use this skill to keep the `admin-web` frontend in sync with the `admin-api` backend and use the generated TanStack Query hooks.

## 1. Full-Stack Synchronization Workflow

Follow these steps whenever the backend API (Controller, DTO, or Entity) changes.

### Step 1: Update Backend Metadata

In `apps/admin-api/`:

```bash
npm run setup:swagger
```

This updates `src/metadata.ts` based on your decorators and DTOs.

### Step 2: Ensure Backend is Running

The frontend synchronization (Orval) needs the backend's JSON documentation.
Make sure `admin-api` is running on `http://localhost:3000`.

### Step 3: Run Orval in Frontend

In `apps/admin-web/`:

```bash
npm run set-up
```

This will:

- Fetch `http://localhost:3000/docs-json`.
- Update `src/api/endpoints.ts` (Hooks).
- Update `src/api/model/*.ts` (Types).
- Update `src/api/zod.ts` (Validation schemas).

---

## 2. Using Generated Hooks

Orval generates TanStack Query (v5) hooks.

### GET Requests (Queries)

Use `use[OperationName]` hooks.

```typescript
import { useGetTenants } from '@/api/endpoints';

function TenantList() {
  const { data, isLoading, error } = useGetTenants();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.data?.map(tenant => (
        <li key={tenant.id}>{tenant.name}</li>
      ))}
    </ul>
  );
}
```

### POST / PUT / DELETE (Mutations)

Use `use[OperationName]Mutation` hooks.

```typescript
import { useCreateTenantMutation } from '@/api/endpoints';
import { toast } from 'sonner';

function CreateTenantForm() {
  const mutation = useCreateTenantMutation({
    mutation: {
      onSuccess: () => {
        // No need to call toast.success() here!
        // It's handled globally in App.tsx via MutationCache.
      },
    }
  });

  const handleSubmit = (data) => {
    mutation.mutate({ data });
  };

  return <button onClick={() => handleSubmit({ name: 'New Org' })} disabled={mutation.isPending}>Create</button>;
}
```

---

## 3. Zod & Form Integration

Use generated Zod schemas with `useAppForm` from `@repo/ui`.

```typescript
import { createTenantSchema } from '@/api/zod';
import { useAppForm } from '@repo/ui/components/form/context';
import z from 'zod';

const form = useAppForm({
  defaultValues: { name: '' },
  validators: {
    onSubmit: createTenantSchema,
  },
  onSubmit: ({ value }) => {
    // Call mutation here
  },
});
```

### Extending Generated Schemas

You can extend generated schemas for UI-specific logic (like adding a "confirm password" field).

```typescript
import { SignInControllerResetPasswordBody } from '@/api/zod';
import { z } from 'zod';

const form = useAppForm({
  defaultValues: {
    password: '',
    confirmPassword: '',
  },
  validators: {
    onSubmit: SignInControllerResetPasswordBody.extend({
      confirmPassword: z.string(),
    }),
  },
  // ...
});
```

---

## 4. Troubleshooting

- **Connection Error**: Check if `admin-api` is actually running on port 3000.
- **Outdated Types**: Ensure you ran `npm run setup:swagger` in the backend **before** `npm run set-up` in the frontend.
- **Type Mismatches**: If the generated model doesn't match the expected type, check the backend decorators (`@ApiProperty`, `@Length`, etc.) and ensure the Swagger plugin is correctly generating metadata.
- **Axios Mutator**: If auth or headers fail, check `src/lib/axios-instance.ts` in `admin-web`.
- **Global Toasts**: Do NOT call `toast.success` or `toast.error` in components. The `admin-web` application handles this globally in `App.tsx` (using `MutationCache`) and `error-handler.ts`.
