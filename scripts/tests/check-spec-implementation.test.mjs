import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const SCRIPT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../check-spec-implementation.mjs',
)
const tempRepositories = []

function runGit(root, argumentsList) {
  return execFileSync('git', argumentsList, { cwd: root, encoding: 'utf8' })
}

function writeFile(root, filePath, content = `${filePath}\n`) {
  const absolutePath = path.join(root, filePath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
}

function removeFile(root, filePath) {
  rmSync(path.join(root, filePath))
}

function createRepository() {
  const root = mkdtempSync(path.join(tmpdir(), 'hms-spec-check-'))
  tempRepositories.push(root)

  runGit(root, ['init', '--initial-branch=feature'])
  runGit(root, ['config', 'user.email', 'spec-check@example.com'])
  runGit(root, ['config', 'user.name', 'Spec Check'])

  writeFile(root, 'src/modify.js', 'baseline\n')
  writeFile(root, 'src/remove.js', 'remove me\n')
  writeFile(root, 'generated/existing.json', '{"baseline":true}\n')
  writeSpec(
    root,
    '| Path | Change | Detail |\n| --- | --- | --- |\n| `src/modify.js` | Modify | pending |',
  )
  runGit(root, ['add', '.'])
  runGit(root, ['commit', '-m', 'baseline'])
  runGit(root, ['update-ref', 'refs/remotes/origin/develop', 'HEAD'])

  return root
}

function writeSpec(root, table) {
  writeFile(
    root,
    'documentation/features/example/checker/spec.md',
    `# Spec\n\n${table}\n`,
  )
}

function runChecker(root, argumentsList = [], options = {}) {
  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, 'documentation/features/example/checker/spec.md', ...argumentsList],
    { cwd: root, encoding: 'utf8' },
  )

  if (options.expectSuccess) {
    assert.equal(result.status, 0, result.stderr || result.stdout)
  }

  return result
}

function parseJson(result) {
  return JSON.parse(result.stdout)
}

function preparePassingChanges(root) {
  writeFile(root, 'src/modify.js', 'modified\n')
  removeFile(root, 'src/remove.js')
  writeFile(root, 'src/create.js', 'created\n')
  writeFile(root, 'generated/new.json', '{"generated":true}\n')
  writeFile(root, 'generated/existing.json', '{"generated":"updated"}\n')
  writeFile(root, 'notes/unrelated.txt', 'unrelated\n')
  writeSpec(
    root,
    [
      '| Path | Change | Detail |',
      '| --- | --- | --- |',
      '| `src/create.js` | Create | new |',
      '| `src/modify.js` | Modify | changed |',
      '| `generated/new.json` | Generate | new output |',
      '| `generated/existing.json` | Generate | refreshed output |',
      '| `src/remove.js` | Remove | deleted |',
    ].join('\n'),
  )
}

test.after(() => {
  for (const root of tempRepositories) rmSync(root, { force: true, recursive: true })
})

test('passes all lifecycles against the default origin/develop ref and counts unrelated files', () => {
  const root = createRepository()
  preparePassingChanges(root)

  const result = runChecker(root, ['--json'], { expectSuccess: true })
  const report = parseJson(result)

  assert.equal(report.ok, true)
  assert.equal(report.structuralOnly, true)
  assert.match(report.scope, /Structural validation only/)
  assert.equal(report.base, 'origin/develop')
  assert.equal(report.summary.declaredPathsCount, 5)
  assert.equal(report.summary.passedPathsCount, 5)
  assert.equal(report.summary.unrelatedChangedFilesCount, 2)
  assert.deepEqual(report.unrelatedChangedFiles, [
    'documentation/features/example/checker/spec.md',
    'notes/unrelated.txt',
  ])
})

test('uses an explicit --base ref without fetching', () => {
  const root = createRepository()
  runGit(root, ['tag', 'custom-base'])
  writeFile(root, 'src/modify.js', 'modified from custom base\n')
  writeSpec(root, '| Path | Change |\n| --- | --- |\n| `src/modify.js` | Modify |')

  const result = runChecker(root, ['--base', 'custom-base', '--json'], {
    expectSuccess: true,
  })
  const report = parseJson(result)

  assert.equal(report.base, 'custom-base')
  assert.equal(report.paths[0].diffStatus, 'M')
})

test('accepts an absolute Spec path inside the repository', () => {
  const root = createRepository()
  writeFile(root, 'src/modify.js', 'modified\n')
  writeSpec(root, '| Path | Change |\n| --- | --- |\n| `src/modify.js` | Modify |')

  const absoluteSpecPath = path.join(
    root,
    'documentation/features/example/checker/spec.md',
  )
  const result = spawnSync(process.execPath, [SCRIPT_PATH, absoluteSpecPath, '--json'], {
    cwd: root,
    encoding: 'utf8',
  })
  const report = parseJson(result)

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(report.specPath, 'documentation/features/example/checker/spec.md')
})

test('accepts the standalone separator forwarded by pnpm', () => {
  const root = createRepository()
  writeFile(root, 'src/modify.js', 'modified\n')
  writeSpec(root, '| Path | Change |\n| --- | --- |\n| `src/modify.js` | Modify |')

  const result = runChecker(root, ['--', '--json'], { expectSuccess: true })

  assert.equal(parseJson(result).ok, true)
})

test('human output explicitly identifies structural-only scope', () => {
  const root = createRepository()
  writeFile(root, 'src/modify.js', 'modified\n')
  writeSpec(root, '| Path | Change |\n| --- | --- |\n| `src/modify.js` | Modify |')

  const result = runChecker(root, [], { expectSuccess: true })

  assert.match(result.stdout, /^Structural validation only;/)
  assert.match(result.stdout, /PASS/)
})

test('classifies lifecycle mismatches for Create, Modify, Generate, and Remove', () => {
  const cases = [
    ['Create', 'src/modify.js', 'BASELINE_PRESENT'],
    ['Modify', 'src/missing.js', 'BASELINE_MISSING'],
    ['Generate', 'generated/existing.json', 'DIFF_MISMATCH'],
    ['Remove', 'src/remove.js', 'CURRENT_FILE_PRESENT'],
  ]

  for (const [change, filePath, expectedCode] of cases) {
    const root = createRepository()
    writeSpec(root, `| Path | Change |\n| --- | --- |\n| \`${filePath}\` | ${change} |`)

    const report = parseJson(runChecker(root, ['--json']))
    assert.equal(report.ok, false, `${change} unexpectedly passed`)
    assert.ok(
      report.issues.some((issue) => issue.code === expectedCode),
      change,
    )
  }
})

test('fails noncanonical affected-path tables instead of silently skipping them', () => {
  const root = createRepository()
  writeSpec(
    root,
    '| Layer/path | Change | Detail |\n| --- | --- | --- |\n| `src/new.js` | Create | x |',
  )

  const report = parseJson(runChecker(root, ['--json']))

  assert.equal(report.ok, false)
  assert.ok(report.issues.some((issue) => issue.code === 'NONCANONICAL_TABLE'))
})

test('rejects malformed tables, malformed rows, and unsupported changes', () => {
  const fixtures = [
    ['| Path | Change |\n| nope | --- |\n| `src/new.js` | Create |', 'MALFORMED_TABLE'],
    [
      '| Path | Change | Detail |\n| --- | --- | --- |\n| `src/new.js` | Create |',
      'MALFORMED_ROW',
    ],
    ['| Path | Change |\n| --- | --- |\n| `src/new.js` | Delete |', 'INVALID_CHANGE'],
  ]

  for (const [table, expectedCode] of fixtures) {
    const root = createRepository()
    writeSpec(root, table)
    const report = parseJson(runChecker(root, ['--json']))
    assert.ok(
      report.issues.some((issue) => issue.code === expectedCode),
      expectedCode,
    )
  }
})

test('requires an exact single-backtick path cell', () => {
  const root = createRepository()
  writeSpec(
    root,
    [
      '| Path | Change |',
      '| --- | --- |',
      '| src/new.js | Create |',
      '| `src/one.js` and `src/two.js` | Create |',
    ].join('\n'),
  )

  const report = parseJson(runChecker(root, ['--json']))

  assert.equal(
    report.issues.filter((issue) => issue.code === 'INVALID_PATH_CELL').length,
    2,
  )
})

test('rejects unsafe, non-normalized, placeholder, glob, brace, and directory paths', () => {
  const root = createRepository()
  const invalidPaths = [
    '/absolute.js',
    'src\\windows.js',
    'src/../escape.js',
    'src/<name>.js',
    'src/*.js',
    'src/{one,two}.js',
    'src',
  ]
  writeSpec(
    root,
    [
      '| Path | Change |',
      '| --- | --- |',
      ...invalidPaths.map((filePath) => `| \`${filePath}\` | Create |`),
    ].join('\n'),
  )

  const report = parseJson(runChecker(root, ['--json']))

  assert.equal(report.ok, false)
  assert.ok(report.issues.some((issue) => issue.code === 'DIRECTORY_PATH'))
  assert.equal(report.issues.filter((issue) => issue.code === 'INVALID_PATH').length, 6)
})

test('rejects NUL bytes in declared paths', () => {
  const root = createRepository()
  writeSpec(root, '| Path | Change |\n| --- | --- |\n| `src/nul\0file.js` | Create |')

  const report = parseJson(runChecker(root, ['--json']))

  assert.ok(
    report.issues.some(
      (issue) => issue.code === 'INVALID_PATH' && issue.message.includes('NUL'),
    ),
  )
})

test('rejects duplicate and conflicting declarations', () => {
  const root = createRepository()
  writeFile(root, 'src/new.js', 'new\n')
  writeSpec(
    root,
    [
      '| Path | Change |',
      '| --- | --- |',
      '| `src/new.js` | Create |',
      '| `src/new.js` | Create |',
      '| `src/new.js` | Generate |',
    ].join('\n'),
  )

  const report = parseJson(runChecker(root, ['--json']))

  assert.ok(report.issues.some((issue) => issue.code === 'DUPLICATE_PATH'))
  assert.ok(report.issues.some((issue) => issue.code === 'CONFLICTING_CHANGE'))
})

test('rejects a declared path with an unresolved Git conflict', () => {
  const root = createRepository()
  const baseline = runGit(root, ['rev-parse', 'HEAD']).trim()

  runGit(root, ['checkout', '-b', 'other'])
  writeFile(root, 'src/modify.js', 'other\n')
  runGit(root, ['add', 'src/modify.js'])
  runGit(root, ['commit', '-m', 'other'])
  runGit(root, ['checkout', 'feature'])
  writeFile(root, 'src/modify.js', 'feature\n')
  runGit(root, ['add', 'src/modify.js'])
  runGit(root, ['commit', '-m', 'feature'])
  spawnSync('git', ['merge', 'other'], { cwd: root, encoding: 'utf8' })
  runGit(root, ['update-ref', 'refs/remotes/origin/develop', baseline])
  writeSpec(root, '| Path | Change |\n| --- | --- |\n| `src/modify.js` | Modify |')

  const report = parseJson(runChecker(root, ['--json']))

  assert.ok(report.issues.some((issue) => issue.code === 'UNMERGED_PATH'))
})

test('reports invalid command input as structural-only JSON', () => {
  const root = createRepository()
  const result = runChecker(root, ['--base', '--json'])
  const report = parseJson(result)

  assert.equal(result.status, 1)
  assert.equal(report.structuralOnly, true)
  assert.equal(report.issues[0].code, 'COMMAND_ERROR')
})
