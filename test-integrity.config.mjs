/**
 * Repository-wide test ownership policy.
 *
 * Every test file must belong to one of the documented boundaries below. Keep
 * this list intentionally explicit: adding a new test boundary requires a
 * corresponding rule-document update.
 */
export default {
  allowedTestPatterns: [
    'packages/core/src/**/use-cases/tests/*.test.ts',
    'apps/server/src/**/rest/controllers/tests/*.test.ts',
    'apps/server/src/**/messaging/inngest/jobs/tests/*.test.ts',
    'apps/server/src/**/database/drizzle/migrations/tests/*.test.ts',
    'apps/server/src/**/provision/tests/*.test.ts',
    'apps/server/src/**/ai/**/tests/*.test.ts',
    'apps/server/src/**/guards/tests/*.test.ts',
    'apps/server/src/shared/communication/tests/*.test.ts',
    'apps/web/src/middlewares/tests/*.test.ts',
    'apps/web/src/routes/**/tests/*.test.ts',
    'apps/web/src/ui/**/widgets/**/tests/*.test.ts',
    'apps/web/src/ui/**/widgets/**/tests/*.test.tsx',
    'apps/web/src/ui/**/hooks/tests/*.test.ts',
    'apps/web/src/ui/**/hooks/tests/*.test.tsx',
    'apps/web/src/ui/**/contexts/**/tests/*.test.ts',
    'apps/web/src/ui/**/contexts/**/tests/*.test.tsx',
    'apps/web/tests/routes/**/*.test.ts',
    'apps/web/tests/routes/**/*.test.tsx',
  ],
  forbiddenTestPatterns: [
    'apps/web/src/rest/services/**/*.test.ts',
    'apps/web/src/rest/services/**/*.test.tsx',
  ],
}
