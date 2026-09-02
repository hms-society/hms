import baseConfiguration from '../../dependency-cruiser.config.mjs'

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
  ],
  options: {
    ...baseConfiguration.options,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
}

export default configuration
