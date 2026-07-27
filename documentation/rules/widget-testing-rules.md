---
description: Vitest and Testing Library rules for web widgets, layouts, hooks, mocks, and navigation behavior.
---

# Widget Testing Rules

These rules apply to tests under `apps/web/src/ui` and define which UI boundaries
receive tests, how those tests are named, and how dependencies are mocked.

## Test public behavior at the owning widget boundary

Tests exercise the smallest public widget or layout that owns a user-visible
behavior. Assert what the user can render, identify, click, and observe rather
than internal JSX structure or implementation details.

An internal widget does not receive a separate test file when it exists only as a
structural part of its owner. For example, `AppLayout` owns its internal `Sidebar`
and `Navbar`; render them through `app-layout.test.tsx` instead of creating
`sidebar.test.tsx` and `navbar.test.tsx`.

Do not mock internal child widgets merely to make the owning widget test smaller.
Rendering the internal composition protects event wiring and accessibility across
the boundary. Extracted hooks may be tested independently when they own state or
effects.

A dedicated widget test becomes appropriate only when the widget has its own
public reuse contract or substantial behavior independent of its current owner.
Do not create tests solely to mirror the file tree.

## File names and test text follow one convention

Place widget and hook tests in a colocated `tests` directory:

```text
widgets/layouts/app-layout/tests/app-layout.test.tsx
widgets/layouts/app-layout/tests/use-app-layout.test.ts
```

Use `.test.tsx` for React component tests and `.test.ts` for hook or non-React
tests. Do not use `.spec.ts` or `.spec.tsx`.

All `describe` labels and test-case descriptions are written in English. Use the
exported widget or hook name for the top-level `describe`:

```ts
describe('AppLayout', () => {
  it('delegates navigation when a sidebar item is clicked', () => {
    // ...
  })
})
```

Descriptions state behavior and outcome. Avoid labels such as `works`, `test 1`,
or method-name-only descriptions.

## Use Vitest and Testing Library

Use Vitest for the runner, assertions, spies, and mocks. Use Testing Library to
render components and hooks and to interact with them.

Prefer accessible queries in this order:

- role and accessible name;
- label or placeholder when appropriate for a form control;
- visible text;
- `data-testid` only when no semantic query can express the behavior.

Use `fireEvent` for the current interaction level. Assertions should focus on
rendered content, accessible state such as `aria-current`, and calls across public
boundaries. Avoid snapshots and class-name assertions for behavior already
expressed semantically.

Clean up rendered components and reset mutable mocks between tests. Configure a
fresh return value in `beforeEach` when a mocked hook drives the widget state.

## Hook tests cover hook-owned behavior

Use `renderHook` for application hooks. A hook test covers the state, derived
values, effects, and handlers owned by that hook. Use `act` when an operation
updates React state.

Mock the nearest application abstraction rather than the third-party hook beneath
it. For example, `useAppLayout` tests mock `useUrlPathname`, not TanStack Router's
`useLocation`.

When one application hook consumes another domain-specific hook, test the
consumer by mocking the domain-specific hook. Test the lower hook separately for
the behavior it owns. For example, a hook consuming `useIntakesQuery` should not
reconstruct a `useQuery` result or test React Query itself.

For realtime hooks, the hook that owns a Supabase subscription must cover event
mapping and cleanup. A higher-level hook consuming it mocks that application hook
instead of mocking Supabase directly.

## Hook mock names mirror the hook

Create the typed mock with `vi.mocked` and name it by appending `Mock` to the hook
name:

```ts
vi.mock('../use-app-layout', () => ({
  useAppLayout: vi.fn(),
}))

const useAppLayoutMock = vi.mocked(useAppLayout)
```

Use `useUrlPathnameMock`, `useIntakesQueryMock`, and equivalent names. Do not use
generic names such as `hookMock`, `mockedHook`, or `mockUseAppLayout`.

Interaction spies follow the same subject-first convention, for example
`anchorOnClickMock` or `handleSidebarToggleMock`.

## Widget mocks reuse the widget's own prop type

When a widget must be mocked, import and use its exported prop type:

```tsx
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
```

Never recreate the prop shape with React utility types, inline object types, or
`any`. A mock must fail to compile when the real widget contract changes.

If a mock factory needs a spy before imports are evaluated, declare it with
`vi.hoisted`. Keep mocks behaviorally minimal while preserving the public contract
needed by the test.

## Mock application wrappers, not third-party libraries

Consumer tests mock the HMS wrapper around a third-party primitive. For navigation,
mock `Anchor`; do not mock TanStack Router's `Link` and do not create an inline
replacement for the router library in every test.

The same rule applies to other established boundaries:

- mock `Icon` rather than Lucide when icon rendering is irrelevant;
- mock `useUrlPathname` rather than `useLocation`;
- mock a domain query hook rather than a generic `useQuery` result;
- mock a domain realtime hook rather than the Supabase client.

Mock the library directly only when the unit under test is the application wrapper
itself.

## Reuse canonical constants in tests

Tests import `ROUTES`, `SIDEBAR_ITEMS`, collaborator profiles, and other canonical
constants. Do not repeat route strings, sidebar item arrays, or production mapping
objects in fixtures.

Use route constants when configuring mocks and asserting navigation:

```ts
useAppLayoutMock.mockReturnValue({
  pathname: ROUTES.intakes,
  sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
  // ...
})
```

Literal strings remain appropriate when the string itself is the behavior under
test, such as visible copy or an intentionally invalid value.

## Navigation has unit and integration boundaries

A layout unit test must cover the user's click and verify that navigation is
delegated to the application navigation wrapper with the canonical route. It does
not need to boot a real TanStack Router.

Actual URL transitions, route loading, history behavior, and rendered destination
pages belong to integration tests with the router configured.

Active-item logic belongs to the layout behavior and must be covered at the owning
layout boundary. Include at least:

- an exact active path;
- a nested path that keeps its parent item active;
- normalization of a trailing slash from the observed pathname;
- the exact-only Home exception.

Assert active navigation through `aria-current='page'`, not through CSS classes.

## Test the fixed profile constraint in the layout hook

While the application profile is intentionally fixed, `useAppLayout` tests must
assert that it returns `SIDEBAR_ITEMS[CollaboratorProfile.Attendant]`. They must
also protect the removal of Communication from the current navigation model.

When authenticated profiles replace the temporary fixed value, update the hook
test to cover profile selection rather than deleting the assertion without a
replacement.
