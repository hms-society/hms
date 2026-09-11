import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = fileURLToPath(new URL('../check-test-integrity.mjs', import.meta.url))

async function git(args, cwd) {
  await execFileAsync('git', args, { cwd })
}

async function fixture(
  testPath,
  testContent = "test('keeps the contract', () => expect(true).toBe(true))\n",
) {
  const root = await mkdtemp(path.join(tmpdir(), 'hms-test-integrity-'))
  await git(['init', '--initial-branch=main'], root)
  await git(['config', 'user.email', 'test@example.com'], root)
  await git(['config', 'user.name', 'Test Integrity'], root)
  await mkdir(path.dirname(path.join(root, testPath)), { recursive: true })
  await writeFile(path.join(root, 'package.json'), '{}\n')
  await writeFile(
    path.join(root, 'test-integrity.config.mjs'),
    `export default ${JSON.stringify({
      allowedTestPatterns: ['apps/example/src/**/tests/*.test.ts'],
      forbiddenTestPatterns: ['apps/example/src/forbidden/**/*.test.ts'],
    })}\n`,
  )
  await writeFile(path.join(root, testPath), testContent)
  await git(['add', '.'], root)
  await git(['commit', '-m', 'test: baseline'], root)
  return root
}

test('passes for a documented test boundary', async () => {
  const root = await fixture('apps/example/src/value/tests/value.test.ts')
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [SCRIPT_PATH, '--json', '--base', 'main'],
      { cwd: root },
    )
    assert.equal(JSON.parse(stdout).status, 'passed')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects a service test path even when it has a test suffix', async () => {
  const root = await fixture('apps/example/src/forbidden/service.test.ts')
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, '--json', '--base', 'main'], {
        cwd: root,
      }),
      (error) => {
        assert.match(error.stdout, /direct test path is forbidden/)
        return true
      },
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects spec suffixes and undocumented paths', async () => {
  const root = await fixture('apps/example/src/value.spec.ts')
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, '--json', '--base', 'main'], {
        cwd: root,
      }),
      (error) => {
        assert.match(error.stdout, /must use the \.test\.ts/)
        return true
      },
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
