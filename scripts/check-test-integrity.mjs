import { execFile } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'

const DEFAULT_BASE = 'origin/develop'
const execFileAsync = promisify(execFile)
const TEST_PATH_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/
const SPEC_PATH_PATTERN = /\.spec\.[cm]?[jt]sx?$/

function parseArguments(argumentsList) {
  let base = DEFAULT_BASE
  let shouldPrintJson = false

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--') continue
    if (argument === '--help') return { shouldPrintHelp: true }
    if (argument === '--json') {
      shouldPrintJson = true
      continue
    }
    if (argument === '--base') {
      const baseArgument = argumentsList[index + 1]
      if (!baseArgument || baseArgument.startsWith('--')) {
        throw new Error('--base requires a Git ref')
      }
      base = baseArgument
      index += 1
      continue
    }
    throw new Error(`Unknown option: ${argument}`)
  }

  return { base, shouldPrintHelp: false, shouldPrintJson }
}

function printHelp() {
  console.log('Usage: pnpm check:test-integrity -- [--base <git-ref>] [--json]')
  console.log('Checks test naming and ownership paths against the allowlist.')
}

async function runGit(argumentsList, cwd) {
  const { stdout } = await execFileAsync('git', argumentsList, {
    cwd,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
  })
  return stdout.toString('utf8')
}

function parseNullSeparated(output) {
  return output.split('\0').filter(Boolean)
}

function parseChangedPaths(output) {
  const values = parseNullSeparated(output)
  const changedPaths = new Map()
  for (let index = 0; index < values.length; index += 2) {
    const status = values[index]
    const filePath = values[index + 1]
    if (status && filePath) changedPaths.set(filePath, status)
  }
  return changedPaths
}

function globToRegExp(pattern) {
  let expression = '^'
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    if (character === '*') {
      if (pattern[index + 1] === '*') {
        index += 1
        if (pattern[index + 1] === '/') {
          index += 1
          expression += '(?:.*/)?'
        } else {
          expression += '.*'
        }
      } else {
        expression += '[^/]*'
      }
      continue
    }
    if (character === '?') {
      expression += '[^/]'
      continue
    }
    expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
  }
  return new RegExp(`${expression}$`)
}

function matchesPattern(filePath, pattern) {
  return globToRegExp(pattern).test(filePath)
}

function matchesAnyPattern(filePath, patterns) {
  return patterns.some((pattern) => matchesPattern(filePath, pattern))
}

function isTestPath(filePath) {
  return TEST_PATH_PATTERN.test(filePath)
}

async function listRepositoryPaths(repositoryRoot) {
  const [currentOutput, deletedOutput] = await Promise.all([
    runGit(
      ['ls-files', '-co', '--exclude-standard', '-z', '--', 'apps', 'packages'],
      repositoryRoot,
    ),
    runGit(['ls-files', '--deleted', '-z', '--', 'apps', 'packages'], repositoryRoot),
  ])
  const deletedPaths = new Set(parseNullSeparated(deletedOutput))
  return parseNullSeparated(currentOutput).filter(
    (filePath) => !deletedPaths.has(filePath),
  )
}

async function loadPolicy(repositoryRoot) {
  const policyPath = path.join(repositoryRoot, 'test-integrity.config.mjs')
  const policyModule = await import(pathToFileURL(policyPath).href)
  if (!policyModule.default) {
    throw new Error(`${policyPath}: default test-integrity policy export is required`)
  }
  return policyModule.default
}

async function checkTestPaths(testPaths, policy) {
  const errors = []
  for (const testPath of testPaths) {
    if (SPEC_PATH_PATTERN.test(testPath)) {
      errors.push(`${testPath}: tests must use the .test.ts or .test.tsx suffix`)
      continue
    }
    if (!matchesAnyPattern(testPath, policy.allowedTestPatterns ?? [])) {
      errors.push(`${testPath}: test path is not one of the documented test boundaries`)
    }
  }
  return errors
}

async function checkTestIntegrity({ base }) {
  const repositoryRoot = (
    await runGit(['rev-parse', '--show-toplevel'], process.cwd())
  ).trim()
  const policy = await loadPolicy(repositoryRoot)
  const baseSha = (
    await runGit(
      ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`],
      repositoryRoot,
    )
  ).trim()
  const [diffOutput, repositoryPaths] = await Promise.all([
    runGit(
      ['diff', '--name-status', '-z', '--no-renames', baseSha, '--'],
      repositoryRoot,
    ),
    listRepositoryPaths(repositoryRoot),
  ])
  const changedPaths = parseChangedPaths(diffOutput)
  const testPaths = repositoryPaths.filter(isTestPath)
  const ownershipErrors = await checkTestPaths(testPaths, policy)
  const changedTestPaths = [...changedPaths.entries()]
    .filter(([filePath, status]) => isTestPath(filePath) && status !== 'D')
    .map(([filePath]) => filePath)
  const errors = ownershipErrors

  return {
    base,
    baseSha,
    trackedTestFiles: testPaths.length,
    changedTestFiles: changedTestPaths.length,
    errors,
    status: errors.length === 0 ? 'passed' : 'failed',
  }
}

function printResult(result, shouldPrintJson) {
  if (shouldPrintJson) {
    console.log(JSON.stringify(result, null, 2))
    return
  }
  console.log(`Test integrity: ${result.status.toUpperCase()}`)
  console.log(`Baseline: ${result.base} (${result.baseSha})`)
  console.log(`Tracked test files: ${result.trackedTestFiles}`)
  console.log(`Changed test files: ${result.changedTestFiles}`)
  for (const error of result.errors) console.error(`ERROR: ${error}`)
  console.log('Boundary: only documented test paths are allowed.')
}

try {
  const argumentsResult = parseArguments(process.argv.slice(2))
  if (argumentsResult.shouldPrintHelp) {
    printHelp()
  } else {
    const result = await checkTestIntegrity(argumentsResult)
    printResult(result, argumentsResult.shouldPrintJson)
    process.exitCode = result.status === 'passed' ? 0 : 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 2
}
