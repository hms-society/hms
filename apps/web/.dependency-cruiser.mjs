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
        'Circular dependencies obscure ownership and violate the documented dependency direction. The generated TanStack route tree is excluded from this source-ownership rule.',
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
    {
      name: 'web-does-not-depend-on-server',
      comment:
        'The Web application consumes Core contracts and REST APIs, not Server implementation.',
      severity: 'error',
      from: {
        path: '^src/',
      },
      to: {
        path: '^\\.\\./server/',
      },
    },
    {
      name: 'react-query-only-in-query-actions-and-root-layout',
      comment:
        'Only query/action hook modules and the RootLayout composition widget may import TanStack React Query.',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot:
          '^(?:src/ui/(?:[^/]+|shared)/hooks/use-[^/]+-(?:query|action)\\.ts|src/ui/shared/widgets/layouts/root-layout/index\\.tsx)$',
      },
      to: {
        path: '(?:@tanstack\\+react-query@|node_modules/@tanstack/react-query/)',
        dependencyTypes: ['npm'],
      },
    },
    {
      name: 'widgets-do-not-access-rest-directly',
      comment:
        'Widgets delegate server query/action orchestration to feature hooks and cannot access REST services or RestContext directly.',
      severity: 'error',
      from: {
        path: '^src/ui/.+/widgets/',
      },
      to: {
        path: '^src/(?:rest/|ui/shared/hooks/use-rest-context\\.)',
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
