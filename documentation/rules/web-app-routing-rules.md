---
description: Routing conventions for the web application, including TanStack Router files, canonical paths, navigation, middleware, search validation, and generated route metadata.
---

# Web App Routing Rules

These rules apply to the TanStack Router layer in `apps/web`. They refine the UI
layer rules for route files, route constants, navigation, middleware, and route
generation.

## Canonical paths live in `ROUTES`

Declare every application path once in:

```text
apps/web/src/constants/routes.ts
```

Use `ROUTES` for links, navigation calls, sidebar configuration, redirects, and
tests. Route keys describe the application concept; path values use kebab-case,
contain no trailing slash except for `/`, and preserve the public URL contract.

```ts
export const ROUTES = {
  root: '/',
  login: '/login',
  intakes: '/intakes',
  newIntake: '/intakes/novo',
} as const
```

Do not introduce a second route map, duplicate a path in a widget, or construct
application paths by concatenating strings. When a path changes, update
`ROUTES`, every consumer, and the generated route tree in the same change.

## TanStack Router route declarations

Route files live directly under:

```text
apps/web/src/routes/
```

Organize every non-root route in a directory named after its URL segment. Use
`index.tsx` for a leaf route and `route.tsx` only when the segment owns a parent
layout with an `Outlet`:

```text
routes/
├── index.tsx              # /
├── login/
│   └── index.tsx          # /login
├── intakes/
│   ├── index.tsx          # /intakes
│   └── novo.tsx           # /intakes/novo
└── advogado/
    ├── route.tsx          # layout de /advogado
    └── consultas.tsx      # /advogado/consultas
```

Directories without `route.tsx` only organize files and do not introduce an
implicit parent route. Do not create `route.tsx` only to group files or express a
common URL prefix.

Each route file owns only route composition:

- import the page or layout widget;
- attach the route middleware;
- validate search parameters;
- declare the route component.

Business decisions, data orchestration, and substantial UI markup belong in the
owning widget, hook, or application adapter—not in the route file.

`createFileRoute` must receive a string literal or plain template literal. The
TanStack route generator cannot transform `createFileRoute(ROUTES.login)`, so
the declaration necessarily repeats the canonical value:

```tsx
export const Route = createFileRoute('/login')({
  component: SignInPage,
})
```

This is the only permitted route-path duplication. All runtime consumers must
use `ROUTES`.

## Route protection and composition

Protected routes use the shared authentication middleware in `beforeLoad`:

```tsx
export const Route = createFileRoute('/home')({
  beforeLoad: requireAuthMiddleware,
  component: HomePage,
})
```

Keep authentication and authorization checks in middleware or route loaders.
Do not duplicate guards inside every page widget. Public routes must not attach
the protected middleware unless the product requirement explicitly demands it.

Parent layout routes compose their layout with `Outlet`; child routes render the
page widget. Route groups that do not share a layout use a directory with
independent leaf routes instead. Do not place a second application shell inside
a child route.

## Search parameters

Routes that consume query parameters must define `validateSearch` in the route
file and return a typed, minimal object. Do not read or cast `window.location`
search values inside page widgets when TanStack Router can provide them through
the route contract.

Validation should describe transport shape only. Domain validation and business
rules belong in the owning use case or application adapter.

## Internal navigation

Use the shared `Anchor` widget for internal links:

```tsx
<Anchor route='newIntake'>Novo intake</Anchor>
```

Use `ROUTES` when a library API requires a path value directly:

```ts
navigate({ to: ROUTES.login })
```

Do not use arbitrary `href` values, route casts, or direct TanStack `Link` setup
for an application route. Native anchors remain appropriate for external URLs
and same-page fragment links.

## Generated route tree

`apps/web/src/routeTree.gen.ts` is generated and read-only. Never edit it by hand.
After adding, removing, renaming, or moving a route file, run:

```bash
pnpm --filter web generate-routes
```

Review the generated diff to ensure that the intended route path, parent-child
relationship, and route imports changed. A route change is incomplete until the
generated tree is synchronized.

## Required validation

For route changes, run the checks in this order:

```bash
pnpm --filter web generate-routes
pnpm --filter web check:code
pnpm --filter web check:types
pnpm --filter web test
```

If `check:code` reports unrelated pre-existing findings, identify them clearly;
do not weaken Biome rules or edit unrelated files merely to hide the failure.
