---
description: Vitest and Testing Library rules for web widgets, layouts, hooks, mocks, and navigation behavior.
---

# Widget Testing Rules

These rules apply to tests under `apps/web/src/ui` and the corresponding browser
integration tests under `apps/web/tests`. They define which UI boundaries receive
tests, how those tests are named, how dependencies are mocked, and the minimum
evidence required before a widget is considered covered.

## Separate widget tests from hook tests

Every widget with an owning hook has two complementary test boundaries:

1. The widget component test (`<widget>.test.tsx`) mocks the widget's own
   colocated hook and verifies that the component maps the hook state to
   accessible markup and delegates user interactions to the handlers returned by
   that hook.
2. The hook test (`use-<widget>.test.ts`) renders the real hook with
   `renderHook` and verifies its state, derived values, effects, guards, and
   interaction behavior.

This separation is mandatory for every behavior-owning widget. A component test
must not use the real owning hook as a substitute for the hook test, and a hook
test must not render the component as a substitute for the component test. The
widget test is intentionally isolated from query, mutation, router, context, and
other hook implementation details.

Tests exercise the smallest public widget or layout that owns a user-visible
behavior. Assert what the user can render, identify, click, and observe rather
than internal JSX structure or implementation details.

An internal widget receives its own pair of tests when it owns behavior or has a
public prop contract. A pure structural child may be covered through its owner.
For example, `AppLayout` may cover a purely structural `Sidebar` through
`app-layout.test.tsx`, while a `Sidebar` with its own hook requires
`sidebar.test.tsx` and `use-sidebar.test.ts`.

Do not mock internal child widgets merely to make a widget test smaller. Render
the real child composition by default. A parent/page state-matrix test may mock
an independent child widget when the purpose is only to verify parent branch
selection; in that case, use the child's exported prop type and keep the child's
own widget tests as the source of its behavior coverage.

When behavior crosses a widget boundary, add an integration or route test only
for the composition contract that cannot be proven by the isolated widget and
hook tests, such as an actual URL transition or end-to-end REST flow. Do not
turn the widget component test into an integration test by rendering its real
owning hook.

## Minimum behavior matrix for stateful widgets

The cases below are the default minimum. Omit a case only when the behavior is
impossible for the widget, and state the reason in the test or evaluation.

- loading/skeleton state;
- successful data state with the primary user-visible content;
- empty state without filters and empty state with filters, when both differ;
- request or mutation error with a visible recovery action;
- pending mutation state, including disabled confirmation controls;
- success outcome after the mutation, including refreshed or closed UI;
- every status or role that changes available actions;
- filter, sort, pagination, and URL synchronization when present;
- dialog/drawer open, cancel/close, confirm, and validation behavior when present;
- protected access and redirect behavior at the route integration boundary.

For tables, test the action availability matrix explicitly. For example, an
invited record may expose resend/cancel, an active record may expose deactivate,
and a disabled record may expose reactivate while forbidding removal. Testing one
row and one action does not cover the table.

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
rendered content and accessible state such as `aria-current`, `role`, `name`,
`aria-disabled`, and `disabled`. Prefer assertions that describe the user-visible
outcome (`toHaveTextContent`, `toBeDisabled`, `toHaveAttribute`, `toBeVisible`)
over implementation calls. Callback assertions are appropriate only when the
callback is the owning widget's public boundary, and must be paired with an
assertion that the resulting UI state is correct when the result is observable.

Do not use `toBeTruthy()` as the primary assertion for a rendered element. Use an
accessible query and assert the property that matters. Avoid snapshots and
class-name assertions for behavior already expressed semantically.

Clean up rendered components and reset mutable mocks between tests. Configure a
fresh return value in `beforeEach` when a mocked hook drives the widget state.

Each test must be independent: do not rely on test order, shared mutable
fixtures, a previous URL, or a previous mock call count. When a test uses a
factory for a controller or service mock, create a fresh factory result per
test and override only the behavior under examination.

## Hook tests cover hook-owned behavior

Use `renderHook` for application hooks. A hook test covers the state, derived
values, effects, and handlers owned by that hook. Use `act` when an operation
updates React state.

The hook under test is the only hook that should be real in its hook test. Mock
its nearest HMS application dependencies, including domain query/action hooks,
navigation wrappers, contexts, and providers. Do not reconstruct a generic
`useQuery`/`useMutation` result when the application hook has a typed contract.

Mock the nearest application abstraction rather than the third-party hook beneath
it. For example, `useAppLayout` tests mock `useUrlPathname`, not TanStack Router's
`useLocation`.

When one application hook consumes another domain-specific hook, test the
consumer by mocking the domain-specific hook. Test the lower hook separately for
the behavior it owns. For example, a hook consuming `useIntakesQuery` should not
reconstruct a `useQuery` result or test React Query itself.

This rule applies to the hook layer. A consumer hook test should verify its
complete state and action matrix, not only one happy-path mutation. Cover every
branch that selects a mutation, maps an error, changes pending state, resets
state, or emits a success effect. The component test separately mocks the
consumer hook and verifies only the widget's rendering and handler wiring.

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

Do not mock the owning widget's internal children merely to bypass difficult
setup. If a dialog, menu, table, or form is part of the widget's public behavior,
render it and interact through its accessible interface. Mock a child only when it
has an independent public contract covered elsewhere and its behavior is outside
the current test's scope; use the child's exported prop type for the mock.

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

## Use core fakers for domain fixtures

When a test needs a core domain entity or structure, use the corresponding faker
from `@hms/core` and override only the fields relevant to the scenario:

```ts
const document = DocumentValidationDocumentFaker.fake({
  id: 'document-file-1',
  status: DocumentValidationStatus.Valid,
})
```

Do not create local helpers named `fakeDocument`, `createDocument`,
`fake<DomainEntity>`, or equivalent object builders for a domain type that
already has a core faker. Do not use arbitrary partial objects cast with `as`
when the faker can provide valid defaults. Local fixtures are appropriate only
for a UI view model that is not a core domain type, or when no faker exists yet;
in the latter case, add the faker in the owning core module instead of copying
the fixture across tests.

## Navigation has unit and integration boundaries

A layout unit test must cover the user's click and verify that navigation is
delegated to the application navigation wrapper with the canonical route. It does
not need to boot a real TanStack Router.

Actual URL transitions, route loading, history behavior, and rendered destination
pages belong to integration tests with the router configured.

Route integration tests live under `apps/web/tests`, use the configured Playwright
fixture, and must assert more than a successful HTTP stub. For each critical route
flow, assert the final URL, visible destination state, protected redirect, and
the outgoing request method/path/query/body that proves the UI-to-API contract.
Mocking the backend with `page.route` is acceptable for deterministic browser
tests, but it must not replace the isolated widget and hook coverage. Do not
count a test as end-to-end if it never exercises the route's actual loader,
middleware, or rendered destination.

## Completion criteria for a widget test suite

Before marking a widget complete, review the suite against this checklist:

- the component test mocks the widget's own hook and asserts the rendered public
  contract and handler wiring;
- the hook test renders the real owning hook and covers its meaningful state and
  action branches;
- each meaningful state and action branch has a user-observable assertion;
- error and pending paths are tested, not only successful callbacks;
- URL/API contracts are asserted where the widget owns filters, pagination, or
  mutations;
- no test passes solely because a mocked handler was called;
- typecheck and the focused Vitest suite pass, with Playwright used for route,
  authentication, form, and REST integration changes.

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
