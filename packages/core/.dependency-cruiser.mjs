import baseConfiguration from '../../dependency-cruiser.config.mjs'

/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  ...baseConfiguration,
  forbidden: [
    ...baseConfiguration.forbidden,
    {
      name: 'core-does-not-depend-on-apps-or-validation',
      comment:
        'Core owns infrastructure-independent domain contracts and cannot depend on application or validation workspaces.',
      severity: 'error',
      from: {
        path: '^src/',
      },
      to: {
        path: '^(?:\\.\\./){2}(?:apps/|packages/validation/)',
      },
    },
    {
      name: 'core-does-not-depend-on-frameworks',
      comment:
        'Core depends on domain contracts, not NestJS, React, persistence, transport, or provider implementations.',
      severity: 'error',
      from: {
        path: '^src/',
      },
      to: {
        path: '^(?:@nestjs/|@supabase/|@tanstack/|drizzle-orm$|inngest$|react$|react-dom$)',
      },
    },
  ],
  options: {
    ...baseConfiguration.options,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
}

export default configuration
