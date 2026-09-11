import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import {
  createCliArguments,
  getScopePatterns,
  materializeBaseline,
  normalizeBaseline,
} from '../check-code-complexity.mjs'

test('creates CodeMultiVitals arguments with the repository config and exclusions', () => {
  const argumentsList = createCliArguments('/tmp/baseline.json')

  assert.deepEqual(argumentsList.slice(0, 3), [
    'exec',
    'code-multivitals',
    'apps/server/src/**/*.ts',
  ])
  assert.ok(argumentsList.includes('!**/*.test.ts'))
  assert.ok(argumentsList.includes('!**/routeTree.gen.ts'))
  assert.deepEqual(argumentsList.slice(-2), ['--baseline', '/tmp/baseline.json'])
})

test('returns the documented workspace scope patterns', () => {
  assert.deepEqual(getScopePatterns('apps/server'), [
    'apps/server/src/**/*.ts',
    '!**/*.test.ts',
    '!**/*.test.tsx',
    '!**/tests/**',
    '!**/routeTree.gen.ts',
  ])
})

test('rejects unknown scopes', () => {
  assert.throws(() => getScopePatterns('apps/unknown'), /Unknown complexity scope/)
})

test('normalizes the baseline to repository paths and keeps only violations', () => {
  const baseline = normalizeBaseline({
    files: [
      {
        filePath: path.resolve('apps/server/src/example.ts'),
        functions: [
          { maintainabilityRating: 'ok', metrics: [{ severity: 'ok' }] },
          { maintainabilityRating: 'ok', metrics: [{ severity: 'warn' }] },
        ],
      },
    ],
    clones: [
      {
        blockA: { filePath: path.resolve('apps/server/src/a.ts') },
        blockB: { filePath: path.resolve('apps/server/src/b.ts') },
      },
    ],
  })

  assert.equal(baseline.files.length, 1)
  assert.equal(baseline.files[0].filePath, 'apps/server/src/example.ts')
  assert.equal(baseline.files[0].functions.length, 1)
  assert.equal(baseline.clones[0].blockA.filePath, 'apps/server/src/a.ts')
  assert.equal(baseline.clones[0].blockB.filePath, 'apps/server/src/b.ts')
})

test('materializes normalized baseline paths for CodeMultiVitals', () => {
  const baseline = materializeBaseline({
    files: [{ filePath: 'apps/server/src/example.ts', functions: [] }],
    clones: [
      {
        blockA: { filePath: 'apps/server/src/a.ts' },
        blockB: { filePath: 'apps/server/src/b.ts' },
      },
    ],
  })

  assert.equal(path.isAbsolute(baseline.files[0].filePath), true)
  assert.equal(path.isAbsolute(baseline.clones[0].blockA.filePath), true)
  assert.equal(path.isAbsolute(baseline.clones[0].blockB.filePath), true)
})
