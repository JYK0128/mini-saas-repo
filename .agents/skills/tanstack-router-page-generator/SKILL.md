---
name: tanstack-router-page-generator
description: Generate new routes and loaders in the frontend using TanStack Router. This skill provides templates for createFileRoute and pre-fetching logic using ensureQueryData.
---

# TanStack Router Page & Route Generator

Use this skill to create new routes and pages in the `admin-web` project.

## 1. Route Structure

In `apps/admin-web/src/routes/`:

- **Public Routes**: Place in `_public/` folder.
- **Protected Routes**: Place in `_protected/` folder.

All routes should use `createFileRoute`.

## 2. Page Template

In `apps/admin-web/src/routes/_protected/<path>.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { get[Operation]QueryOptions } from '@/api/endpoints';

export const Route = createFileRoute('/_protected/<path>')({
  // 1. Data Loading (Pre-fetching)
  beforeLoad: ({ context }) => {
    return context.queryClient.ensureQueryData(
      get[Operation]QueryOptions()
    );
  },
  component: <Path>Page,
});

function <Path>Page() {
  // 2. Access pre-fetched data
  const context = Route.useLoaderData();
  
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold font-display">Page Title</h1>
      {/* Render logic here */}
    </div>
  );
}
```

## 3. Routing Logic & Redirects (`beforeLoad`)

`beforeLoad` is used for authentication, authorization, and conditional redirects. Do **not** use it for data pre-fetching (caching) unless routing logic depends on that data.

```typescript
import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router';
import { hasApiError } from '@/lib/error-handler';

export const Route = createFileRoute('/_protected/<path>')({
  beforeLoad: async ({ context, location }) => {
    // 1. Logic-based Redirect (Check if user is allowed)
    if (!context.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    // 2. Conditional Redirect based on user state
    if (context.user.needsOnboarding && location.pathname !== '/onboarding') {
      throw redirect({ to: '/onboarding' });
    }
  },
  component: RouteComponent,
});
```

> [!IMPORTANT]
> Keep `beforeLoad` focused on routing flow control. For pure data fetching, rely on standard hooks within the component or the `loader` function if necessary.

## 4. Path-based Layout Selection

Ensure you use the correct layout prefix in `createFileRoute`:

- For login/signup: `createFileRoute('/_public/login')`
- For dashboard/settings: `createFileRoute('/_protected/dashboard')`

---

## 5. Metadata & SEO

Follow the project's aesthetics guide for headers and navigation. Use the standard `admin-web` styling (zinc/slate palette) for page containers.

```typescript
<header className="flex items-center justify-between mb-8">
  <h2 className="text-3xl font-extrabold tracking-tighter">Header</h2>
</header>
```
