import baseConfiguration from '../../dependency-cruiser.config.mjs'

/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  ...baseConfiguration,
  forbidden: [
    ...baseConfiguration.forbidden,
    {
      name: 'validation-does-not-depend-on-apps',
      comment:
        'Validation is a shared contract package and cannot depend on Server or Web application code.',
      severity: 'error',
      from: {
        path: '^src/',
      },
      to: {
        path: '^(?:\\.\\./){2}apps/',
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
