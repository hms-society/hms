/**
 * Source ownership for the HMS test integrity gate.
 *
 * Core use cases and REST controllers require a direct test when changed.
 * Other source files may have a direct test where the repository's existing
 * testing rules permit it. Generated files, fixtures, and barrels are excluded.
 */
export default {
  sourcePatterns: {
    required: [
      'packages/core/src/**/use-cases/*-use-case.ts',
      'apps/server/src/**/rest/controllers/*.controller.ts',
    ],
    allowed: [
      'apps/**/src/**/*.ts',
      'apps/**/src/**/*.tsx',
      'packages/**/src/**/*.ts',
      'packages/**/src/**/*.tsx',
    ],
    indirect: [
      'apps/server/src/**/database/drizzle/repositories/**/*.ts',
      'apps/server/src/**/database/drizzle/models/**/*.ts',
    ],
    excluded: [
      'apps/**/src/**/fixtures/**/*.ts',
      'apps/**/src/**/mocks/**/*.ts',
      'apps/**/src/**/tests/**/*.ts',
      'apps/**/src/**/tests/**/*.tsx',
      'apps/**/src/**/*.d.ts',
      'apps/**/src/**/*.generated.ts',
      'packages/**/src/**/index.ts',
      'packages/**/src/**/fixtures/**/*.ts',
      'packages/**/src/**/mocks/**/*.ts',
      'packages/**/src/**/tests/**/*.ts',
      'packages/**/src/**/*.d.ts',
      'packages/**/src/**/*.generated.ts',
    ],
  },
  boundaryTestPatterns: [
    'apps/web/tests/**/*.test.ts',
    'apps/web/tests/**/*.test.tsx',
    'apps/web/src/routes/**/*.test.ts',
    'apps/web/src/routes/**/*.test.tsx',
    'apps/web/src/ui/**/*.test.ts',
    'apps/web/src/ui/**/*.test.tsx',
    'apps/web/src/rest/services/tests/*.test.ts',
    'apps/server/src/**/tests/**/*.test.ts',
    'apps/server/src/shared/communication/*.spec.ts',
    'apps/server/src/shared/provision/**/*.test.ts',
    'packages/core/src/**/tests/**/*.test.ts',
  ],
  testPathRules: [
    {
      pattern: 'packages/core/src/**/use-cases/**/*.test.ts',
      requiredDirectory: 'tests',
    },
    {
      pattern: 'apps/server/src/**/rest/controllers/**/*.test.ts',
      requiredDirectory: 'tests',
    },
    {
      pattern: 'apps/web/src/ui/**/widgets/**/*.test.ts',
      requiredDirectory: 'tests',
    },
    {
      pattern: 'apps/web/src/ui/**/widgets/**/*.test.tsx',
      requiredDirectory: 'tests',
    },
  ],
  forbiddenTestPatterns: [],
}
