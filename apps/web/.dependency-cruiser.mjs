import baseConfiguration from '../../dependency-cruiser.config.mjs'

const webBaseRules = baseConfiguration.forbidden.filter(
  ({ name }) => name !== 'no-circular-dependencies',
)

/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  ...baseConfiguration,
  forbidden: [
    ...webBaseRules,
    {
      name: 'no-circular-dependencies',
      comment:
        'Circular dependencies obscure ownership and violate the documented dependency direction. Generated route metadata is excluded from this source-ownership rule.',
      severity: 'error',
      from: {
        pathNot: ['^src/router\\.tsx$', '^src/routeTree\\.gen\\.ts$'],
      },
      to: {
        circular: true,
      },
    },
    {
      name: 'generated-route-tree-has-no-source-owned-cycles',
      comment:
        'Generated TanStack route metadata may refer to router types, but it cannot participate in any other cycle.',
      severity: 'error',
      from: {
        path: '^src/routeTree\\.gen\\.ts$',
      },
      to: {
        circular: true,
        pathNot: '^src/router\\.tsx$',
      },
    },
    {
      name: 'router-has-no-source-owned-cycles',
      comment:
        'Router composition may depend on TanStack Router generated route metadata, but it cannot participate in any other cycle.',
      severity: 'error',
      from: {
        path: '^src/router\\.tsx$',
      },
      to: {
        circular: true,
        pathNot: '^src/routeTree\\.gen\\.ts$',
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
