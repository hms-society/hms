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

const moduleDatabaseRules = SERVER_MODULES.map((moduleName) => ({
  name: `${moduleName}-database-ownership`,
  comment:
    'A business module cannot import database implementation owned by another module.',
  severity: 'error',
  from: {
    path: `^src/${moduleName}/`,
    pathNot: [`^src/${moduleName}/fixtures/`, '/tests/'],
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
