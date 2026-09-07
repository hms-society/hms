import baseConfiguration from '../../dependency-cruiser.config.mjs'

const SERVER_MODULES = [
  'case-management',
  'communication',
  'consultation',
  'document-engine',
  'document-production',
  'formalization',
  'identity',
  'intake',
  'legal-catalog',
  'scheduling',
]

// These legacy composition/repository paths still join data owned by more
// than one module. Keep the ownership rule active for all other sources while
// the shared database contracts are migrated behind module interfaces.
const LEGACY_DATABASE_DEPENDENCY_EXCEPTIONS = [
  '^src/document-engine/provision/document-engine-provision\\.module\\.ts$',
  '^src/document-engine/database/drizzle/repositories/drizzle-document-validations-repository\\.ts$',
  '^src/case-management/database/drizzle/repositories/drizzle-legal-cases-repository\\.ts$',
]

const moduleDatabaseRules = SERVER_MODULES.map((moduleName) => ({
  name: `${moduleName}-database-ownership`,
  comment:
    'A business module cannot import database implementation owned by another module.',
  severity: 'error',
  from: {
    path: `^src/${moduleName}/`,
    pathNot: [
      `^src/${moduleName}/fixtures/`,
      '/tests/',
      ...LEGACY_DATABASE_DEPENDENCY_EXCEPTIONS,
    ],
  },
  to: {
    path: `^src/(?!(?:${moduleName}|shared)/)[^/]+/database/`,
    pathNot: '-database\\.module\\.ts$',
  },
}))

/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  ...baseConfiguration,
  forbidden: [
    ...baseConfiguration.forbidden,
    {
      name: 'server-does-not-depend-on-web',
      comment: 'The Server application cannot depend on Web application implementation.',
      severity: 'error',
      from: {
        path: '^src/',
      },
      to: {
        path: '^\\.\\./web/',
      },
    },
    ...moduleDatabaseRules,
  ],
  options: {
    ...baseConfiguration.options,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
}

export default configuration
