# TanStack Router Setup

This directory contains the route definitions for the application using TanStack Router.

## Structure

- `__root.tsx` - Root layout route that wraps all other routes
- `index.tsx` - Home page route (/)
- Additional routes can be added as needed

## Best Practices

### 1. Route Organization

- Each route is a separate file in the `routes` directory
- Use descriptive file names that match the URL structure
- Group related routes in subdirectories

### 2. Type Safety

- The router is fully type-safe with automatic route generation
- Search parameters are validated using Zod schemas
- Route parameters are automatically typed

### 3. Error Handling

- Each route can define its own error boundary
- Global error handling is configured in the router setup
- Use the `errorComponent` property for route-specific error handling

### 4. Loading States

- Define `pendingComponent` for loading states
- Use `defaultPendingComponent` for consistent loading UI
- Implement route-level data loading with `loader` functions

### 5. Search Parameters

- Define search parameter schemas in `paramSchemas.tsx`
- Use Zod for validation and type inference
- Access search params with `useSearch()` hook

### 6. Navigation

- Use `useNavigate()` for programmatic navigation
- Use `<Link>` component for declarative navigation
- Preserve search params when navigating with the `search` callback

## Example Route

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

const searchSchema = z.object({
  filter: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute('/products')({
  validateSearch: zodValidator(searchSchema),
  component: ProductsPage,
  errorComponent: ProductsError,
  pendingComponent: ProductsLoading,
  loader: async ({ search }) => {
    // Load data based on search params
    return fetchProducts(search);
  },
});
```

## Adding New Routes

1. Create a new file in the `routes` directory
2. Export a `Route` object using `createFileRoute`
3. Run the dev server to generate types
4. The route will be automatically registered

## Configuration

Router configuration is centralized in `lib/router.ts` with:

- Default preload strategy
- Global error/pending/404 components
- Type registration
- Context setup
