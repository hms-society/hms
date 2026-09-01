/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  forbidden: [
    {
      name: 'no-circular-dependencies',
      comment:
        'Circular dependencies obscure ownership and violate the documented dependency direction.',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      dependencyTypes: [
        'npm',
        'npm-bundled',
        'npm-dev',
        'npm-no-pkg',
        'npm-optional',
        'npm-peer',
        'npm-unknown',
      ],
    },
    moduleSystems: ['es6', 'cjs'],
    tsPreCompilationDeps: true,
  },
}

export default configuration
