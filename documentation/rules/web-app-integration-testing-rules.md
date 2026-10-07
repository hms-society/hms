---
description: Playwright integration-test boundaries for web layouts and pages, with the server-owned API boundary.
---

# Web App Integration Testing Rules

These rules define how browser integration tests in `apps/web/tests` fit with the
server API integration tests. Read them when creating or changing Playwright tests
for layout composition, routes, pages, authentication, or web-to-API behavior.

## Keep layout, page, and API integration boundaries distinct

HMS uses three complementary integration boundaries:

1. **Layout integration** exercises a real route with the shared layout and
   configured router. Keep shared-shell coverage under
   `apps/web/tests/shared/`. Assert rendered shell content, profile-specific
   navigation, active route state, and user-visible layout interactions. Cover
   keyboard interaction and narrow viewports when those behaviors are in scope.
2. **Page integration** exercises a real route, its middleware and page, and the
   resulting browser behavior. Keep feature coverage under
   `apps/web/tests/<feature>/`. Assert the final URL, visible destination
   state, protected access behavior, and relevant web-to-API request details.
3. **API integration** exercises the real server endpoint through NestJS and
   Supertest. It belongs to the server controller test under
   `apps/server/src/<module>/rest/controllers/tests/`, following
   [`controllers-testing-rules.md`](controllers-testing-rules.md).

Name browser test files after the page they exercise, using the
`<page-name>-page.test.ts` pattern. For example, use
`apps/web/tests/identity/sign-in-page.test.ts`. Name shared layout
integration files with `<layout-name>-layout.test.ts`, such as
`apps/web/tests/shared/app-layout.test.ts`. Keep page and layout coverage
distinguishable in the filename even though they are both Playwright tests.

Name custom Playwright fixture properties and callback variables with the
feature name followed by `Fixture`. For example, use `identityFixture` in a
test and `FixtureIdentity` for its fixture extension type. Leave Playwright's
built-in fixtures such as `page` and `context` unchanged.

Prefer the existing canonical fakers exported from `@hms/core` in Vitest tests
when they need domain-shaped data. Pass scenario-specific values as faker
overrides, then map the resulting entity to the API response shape when the
transport DTO differs. Playwright test fixtures run in Node, while `@hms/core`
exports TypeScript source; keep their mocked HTTP payloads as explicit DTOs
instead of importing Core fakers at runtime. Do not add a local domain entity
fake builder when a canonical faker is usable in the current test runtime.

Layout and page tests establish browser composition and user-visible behavior.
Controller tests establish the server HTTP and persistence contract. Do not use a
browser test as a substitute for the owning controller integration test.

## Classify mocked browser coverage accurately

The Playwright config starts the web app and applies browser fixtures; it does
not start the real Nest server, database, or Supabase Auth services. Existing
fixtures may install a local fake auth session or stub backend requests with
`page.route` to isolate a layout or page flow.

When authentication or HTTP is mocked, describe the result as mocked layout or
page coverage. A stubbed response can prove that the browser sends the expected
method, path, query, or body and renders the supplied response. It does not prove
that real Auth, the server endpoint, or persistence works.

Do not label a route test end-to-end if it does not exercise the real route,
middleware, loader, or rendered destination. Keep isolated widget and hook tests
as separate boundaries; browser tests should cover composition that those tests
cannot prove.

## Assert browser behavior and request contracts

Use the configured Playwright fixtures and accessible locators. For the
user-visible path, assert the destination URL and rendered result, not only that
navigation completed or a mocked handler ran. For web-to-API mapping, observe the
request and assert its method, path, query, and body as applicable; pair that
assertion with the visible response state when the result affects the user.

Use canonical route constants for routes that are exported by
`apps/web/src/constants/routes.ts`. Use a literal path only when the specific
unexported route path is the behavior under test.

After navigation or a state-changing interaction, resolve fresh locators. Prefer
role and accessible name locators over CSS selectors. For UI changes, cover a
narrow viewport and keyboard interaction; explicitly validate responsive,
focus, theme, or accessibility behavior when the contract includes it.

## Use the configured Playwright commands

Run the full browser suite with:

```bash
pnpm --filter web test:integration
```

Run a focused test with:

```bash
pnpm --filter web exec playwright test tests/shared/app-layout.test.ts
```

For real authenticated server-backed behavior, follow the required browser
workflow in the repository `AGENTS.md`. Confirm services are healthy, start the
server and web app, authenticate through `/login`, and validate protected-route
behavior against real Auth and REST services. Keep `page.route` stubs limited to
mocked layout or page coverage.

## Follow the server-owned API rule

Each REST controller has its own real integration test under
`apps/server/src/<module>/rest/controllers/tests/`. Those tests use the Nest test
application, Supertest, real repositories, and the database fixture. Follow
[`controllers-testing-rules.md`](controllers-testing-rules.md) for fixture
lifecycle, persistence setup, isolation, and HTTP assertions.
