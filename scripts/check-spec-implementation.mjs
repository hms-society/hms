#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'

const DEFAULT_BASE = 'origin/develop'
const ALLOWED_CHANGES = new Set(['Create', 'Modify', 'Generate', 'Remove'])
const STRUCTURAL_SCOPE =
  'Structural validation only; this check does not verify behavior, correctness, or completeness.'

function runGit(root, argumentsList) {
  try {
    return execFileSync('git', argumentsList, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const detail = error.stderr?.trim() || error.message
    throw new Error(`git ${argumentsList.join(' ')} failed: ${detail}`)
  }
}

function parseArguments(argumentsList) {
  let base = DEFAULT_BASE
  let isJson = false
  let specPath

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]

    if (argument === '--') continue

    if (argument === '--json') {
      isJson = true
      continue
    }

    if (argument === '--base') {
      const value = argumentsList[index + 1]
      if (!value || value.startsWith('--')) throw new Error('--base requires a git ref')
      base = value
      index += 1
      continue
    }

    if (argument.startsWith('--')) throw new Error(`unknown option: ${argument}`)
    if (specPath) throw new Error('exactly one Spec path is required')
    specPath = argument
  }

  if (!specPath) throw new Error('a Spec path is required')

  return { base, isJson, specPath }
}

function splitTableRow(line) {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) return null

  const cells = []
  let cell = ''
  let isEscaped = false

  for (const character of trimmed) {
    if (isEscaped) {
      cell += character
      isEscaped = false
      continue
    }

    if (character === '\\') {
      cell += character
      isEscaped = true
      continue
    }

    if (character === '|') {
      cells.push(cell.trim())
      cell = ''
      continue
    }

    cell += character
  }

  cells.push(cell.trim())
  if (cells[0] === '') cells.shift()
  if (cells.at(-1) === '') cells.pop()

  return cells
}

function isSeparatorRow(cells, columnsCount) {
  return (
    cells?.length === columnsCount &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replaceAll(' ', '')))
  )
}

function createIssue(code, message, details = {}) {
  return { code, message, ...details }
}

function parseAffectedPaths(markdown) {
  const lines = markdown.split(/\r?\n/)
  const entries = []
  const issues = []
  let canonicalTablesCount = 0

  for (let index = 0; index < lines.length; index += 1) {
    const headers = splitTableRow(lines[index])
    if (headers?.[1] !== 'Change') continue

    const line = index + 1
    if (headers[0] !== 'Path') {
      issues.push(
        createIssue(
          'NONCANONICAL_TABLE',
          `affected-path table must start with exactly "Path | Change", found "${headers[0]} | Change"`,
          { line },
        ),
      )
    }

    const separator = splitTableRow(lines[index + 1] ?? '')
    if (!isSeparatorRow(separator, headers.length)) {
      issues.push(
        createIssue(
          'MALFORMED_TABLE',
          'table header must be followed by a valid Markdown separator',
          {
            line: line + 1,
          },
        ),
      )
      continue
    }

    const isCanonical = headers[0] === 'Path'
    if (isCanonical) canonicalTablesCount += 1
    index += 2

    while (index < lines.length) {
      const cells = splitTableRow(lines[index])
      if (!cells) {
        index -= 1
        break
      }

      if (cells.length !== headers.length) {
        issues.push(
          createIssue(
            'MALFORMED_ROW',
            `table row has ${cells.length} columns; expected ${headers.length}`,
            { line: index + 1 },
          ),
        )
      } else if (isCanonical) {
        const [pathCell, change] = cells
        const match = /^`([^`]*)`$/.exec(pathCell)

        if (!match) {
          issues.push(
            createIssue(
              'INVALID_PATH_CELL',
              'path cell must contain exactly one backticked repository-relative file',
              { line: index + 1 },
            ),
          )
        } else if (!ALLOWED_CHANGES.has(change)) {
          issues.push(
            createIssue(
              'INVALID_CHANGE',
              `change must be one of: ${[...ALLOWED_CHANGES].join(', ')}`,
              { line: index + 1, path: match[1] },
            ),
          )
        } else {
          entries.push({ change, line: index + 1, path: match[1] })
        }
      }

      index += 1
    }
  }

  if (canonicalTablesCount === 0) {
    issues.push(
      createIssue(
        'MISSING_AFFECTED_PATH_TABLE',
        'Spec must contain at least one Markdown table beginning with exactly "Path | Change"',
      ),
    )
  }

  return { entries, issues }
}

function validateRepositoryPath(filePath) {
  if (filePath === '') return 'path is empty'
  if (filePath.includes('\0')) return 'path contains a NUL byte'
  if (filePath.includes('\\')) return 'path contains a backslash'
  if (path.posix.isAbsolute(filePath)) return 'path is absolute'
  if (
    filePath === '.' ||
    filePath.endsWith('/') ||
    path.posix.normalize(filePath) !== filePath
  ) {
    return 'path is not normalized'
  }

  const segments = filePath.split('/')
  if (segments.includes('.') || segments.includes('..'))
    return 'path traverses a directory'
  if (/[<>]|\.\.\.|…/.test(filePath)) return 'path contains a placeholder'
  if (/[*?[\]]/.test(filePath)) return 'path contains a glob'
  if (/[{}]/.test(filePath)) return 'path contains brace expansion'

  return null
}

function parseNullList(output) {
  return output.split('\0').filter(Boolean)
}

function readGitState(root, base) {
  const commit = runGit(root, ['rev-parse', '--verify', `${base}^{commit}`]).trim()
  const baselineFiles = new Set(
    parseNullList(runGit(root, ['ls-tree', '-r', '--name-only', '-z', commit])),
  )
  const trackedFiles = new Set(
    parseNullList(runGit(root, ['ls-files', '--cached', '-z'])),
  )
  const untrackedFiles = new Set(
    parseNullList(runGit(root, ['ls-files', '--others', '--exclude-standard', '-z'])),
  )
  const unmergedFiles = new Set(
    parseNullList(runGit(root, ['ls-files', '--unmerged', '-z'])).map((record) => {
      return record.slice(record.indexOf('\t') + 1)
    }),
  )
  const changedByPath = new Map()

  const diffRecords = parseNullList(
    runGit(root, ['diff', '--name-status', '--no-renames', '-z', commit, '--']),
  )
  for (let index = 0; index < diffRecords.length; index += 2) {
    const status = diffRecords[index]
    const filePath = diffRecords[index + 1]
    if (!filePath) throw new Error('git diff returned an incomplete name-status record')
    changedByPath.set(filePath, status[0])
  }

  for (const filePath of untrackedFiles) changedByPath.set(filePath, 'A')

  return {
    baselineFiles,
    changedByPath,
    commit,
    trackedFiles,
    unmergedFiles,
    untrackedFiles,
  }
}

function inspectCurrentFile(root, filePath) {
  try {
    const stats = lstatSync(path.join(root, filePath))
    return { exists: true, isFile: stats.isFile() }
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return { exists: false, isFile: false }
    }
    throw error
  }
}

function isBaselineDirectory(baselineFiles, filePath) {
  const prefix = `${filePath}/`
  return [...baselineFiles].some((baselinePath) => baselinePath.startsWith(prefix))
}

function validateLifecycle(entry, root, gitState) {
  const issues = []
  const current = inspectCurrentFile(root, entry.path)
  const isBaselineFile = gitState.baselineFiles.has(entry.path)
  const isKnownCurrentPath =
    gitState.trackedFiles.has(entry.path) || gitState.untrackedFiles.has(entry.path)
  const diffStatus = gitState.changedByPath.get(entry.path) ?? null

  if (
    isBaselineDirectory(gitState.baselineFiles, entry.path) ||
    (current.exists && !current.isFile)
  ) {
    issues.push(
      createIssue('DIRECTORY_PATH', 'affected path must identify a file', entry),
    )
    return { ...entry, diffStatus, issues, status: 'failed' }
  }

  if (gitState.unmergedFiles.has(entry.path) || diffStatus === 'U') {
    issues.push(
      createIssue('UNMERGED_PATH', 'affected path has an unresolved Git conflict', entry),
    )
  }

  if (entry.change === 'Create') {
    if (isBaselineFile) {
      issues.push(
        createIssue(
          'BASELINE_PRESENT',
          'Create path already exists in the baseline',
          entry,
        ),
      )
    }
    if (!current.exists || !current.isFile) {
      issues.push(
        createIssue('CURRENT_FILE_MISSING', 'Create path is not a current file', entry),
      )
    }
    if (current.exists && !isKnownCurrentPath) {
      issues.push(
        createIssue(
          'CURRENT_PATH_IGNORED',
          'Create path is ignored or unknown to Git',
          entry,
        ),
      )
    }
    if (diffStatus !== 'A') {
      issues.push(
        createIssue(
          'DIFF_MISMATCH',
          'Create path must be an added file in the diff',
          entry,
        ),
      )
    }
  }

  if (entry.change === 'Modify') {
    if (!isBaselineFile) {
      issues.push(
        createIssue(
          'BASELINE_MISSING',
          'Modify path does not exist in the baseline',
          entry,
        ),
      )
    }
    if (!current.exists || !current.isFile) {
      issues.push(
        createIssue('CURRENT_FILE_MISSING', 'Modify path is not a current file', entry),
      )
    }
    if (current.exists && !isKnownCurrentPath) {
      issues.push(
        createIssue(
          'CURRENT_PATH_IGNORED',
          'Modify path is ignored or unknown to Git',
          entry,
        ),
      )
    }
    if (diffStatus !== 'M') {
      issues.push(
        createIssue('DIFF_MISMATCH', 'Modify path must be modified in the diff', entry),
      )
    }
  }

  if (entry.change === 'Generate') {
    if (!current.exists || !current.isFile) {
      issues.push(
        createIssue('CURRENT_FILE_MISSING', 'Generate path is not a current file', entry),
      )
    }
    if (current.exists && !isKnownCurrentPath) {
      issues.push(
        createIssue(
          'CURRENT_PATH_IGNORED',
          'Generate path is ignored or unknown to Git',
          entry,
        ),
      )
    }
    if (!['A', 'M'].includes(diffStatus)) {
      issues.push(
        createIssue(
          'DIFF_MISMATCH',
          'Generate path must be added or modified in the diff',
          entry,
        ),
      )
    }
    if (
      (diffStatus === 'A' && isBaselineFile) ||
      (diffStatus === 'M' && !isBaselineFile)
    ) {
      issues.push(
        createIssue(
          'BASELINE_DIFF_MISMATCH',
          'Generate baseline state disagrees with its diff status',
          entry,
        ),
      )
    }
  }

  if (entry.change === 'Remove') {
    if (!isBaselineFile) {
      issues.push(
        createIssue(
          'BASELINE_MISSING',
          'Remove path does not exist in the baseline',
          entry,
        ),
      )
    }
    if (current.exists) {
      issues.push(
        createIssue(
          'CURRENT_FILE_PRESENT',
          'Remove path still exists in the filesystem',
          entry,
        ),
      )
    }
    if (diffStatus !== 'D') {
      issues.push(
        createIssue('DIFF_MISMATCH', 'Remove path must be deleted in the diff', entry),
      )
    }
  }

  return {
    ...entry,
    diffStatus,
    issues,
    status: issues.length === 0 ? 'passed' : 'failed',
  }
}

function validateEntries(parsed, root, gitState) {
  const issues = [...parsed.issues]
  const seenChanges = new Map()
  const validEntries = []

  for (const entry of parsed.entries) {
    const pathProblem = validateRepositoryPath(entry.path)
    if (pathProblem) {
      issues.push(createIssue('INVALID_PATH', pathProblem, entry))
      continue
    }

    const previousChange = seenChanges.get(entry.path)
    if (previousChange) {
      const code =
        previousChange === entry.change ? 'DUPLICATE_PATH' : 'CONFLICTING_CHANGE'
      const message =
        previousChange === entry.change
          ? 'affected path is declared more than once'
          : `affected path has conflicting changes: ${previousChange} and ${entry.change}`
      issues.push(createIssue(code, message, entry))
      continue
    }

    seenChanges.set(entry.path, entry.change)
    validEntries.push(entry)
  }

  const results = validEntries.map((entry) => validateLifecycle(entry, root, gitState))
  for (const result of results) issues.push(...result.issues)

  return { issues, results }
}

function resolveSpecPath(root, suppliedSpecPath) {
  const absoluteSpecPath = path.isAbsolute(suppliedSpecPath)
    ? path.resolve(suppliedSpecPath)
    : path.resolve(root, suppliedSpecPath)
  const specPath = path.relative(root, absoluteSpecPath).split(path.sep).join('/')
  const problem = validateRepositoryPath(specPath)
  if (problem) throw new Error(`invalid Spec path: ${problem}`)
  if (!/^documentation\/features\/(?:[^/]+\/)+spec\.md$/.test(specPath)) {
    throw new Error('Spec path must match documentation/features/**/spec.md')
  }

  return specPath
}

function buildReport(options, root) {
  const specPath = resolveSpecPath(root, options.specPath)

  const absoluteSpecPath = path.join(root, specPath)
  const markdown = readFileSync(absoluteSpecPath, 'utf8')
  const parsed = parseAffectedPaths(markdown)
  const gitState = readGitState(root, options.base)
  const validation = validateEntries(parsed, root, gitState)
  const declaredPaths = new Set(parsed.entries.map((entry) => entry.path))
  const changedFiles = [...gitState.changedByPath.keys()].sort()
  const unrelatedChangedFiles = changedFiles.filter(
    (filePath) => !declaredPaths.has(filePath),
  )

  return {
    ok: validation.issues.length === 0,
    structuralOnly: true,
    scope: STRUCTURAL_SCOPE,
    specPath,
    base: options.base,
    baselineCommit: gitState.commit,
    summary: {
      declaredPathsCount: parsed.entries.length,
      passedPathsCount: validation.results.filter((result) => result.status === 'passed')
        .length,
      failedChecksCount: validation.issues.length,
      changedFilesCount: changedFiles.length,
      unrelatedChangedFilesCount: unrelatedChangedFiles.length,
    },
    paths: validation.results,
    issues: validation.issues,
    unrelatedChangedFiles,
  }
}

function printHuman(report) {
  console.log(STRUCTURAL_SCOPE)
  console.log(`${report.ok ? 'PASS' : 'FAIL'} ${report.specPath} against ${report.base}`)
  console.log(
    `Declared: ${report.summary.declaredPathsCount}; changed: ${report.summary.changedFilesCount}; unrelated changed: ${report.summary.unrelatedChangedFilesCount}`,
  )

  for (const result of report.paths) {
    console.log(
      `- ${result.status.toUpperCase()} ${result.change} ${result.path} (${result.diffStatus ?? 'no diff'})`,
    )
  }

  for (const issue of report.issues) {
    const location = [issue.path, issue.line ? `line ${issue.line}` : null]
      .filter(Boolean)
      .join(', ')
    console.log(`- ${issue.code}${location ? ` [${location}]` : ''}: ${issue.message}`)
  }
}

function printFatal(error, isJson) {
  const report = {
    ok: false,
    structuralOnly: true,
    scope: STRUCTURAL_SCOPE,
    issues: [createIssue('COMMAND_ERROR', error.message)],
  }

  if (isJson) console.log(JSON.stringify(report, null, 2))
  else {
    console.error(STRUCTURAL_SCOPE)
    console.error(`FAIL: ${error.message}`)
    console.error(
      'Usage: pnpm check:spec-implementation -- <documentation/features/**/spec.md> [--base <git-ref>] [--json]',
    )
  }
}

function main() {
  const rawArguments = process.argv.slice(2)
  const wantsJson = rawArguments.includes('--json')

  try {
    const options = parseArguments(rawArguments)
    const root = runGit(process.cwd(), ['rev-parse', '--show-toplevel']).trim()
    const report = buildReport(options, root)

    if (options.isJson) console.log(JSON.stringify(report, null, 2))
    else printHuman(report)

    if (!report.ok) process.exitCode = 1
  } catch (error) {
    printFatal(error, wantsJson)
    process.exitCode = 1
  }
}

main()
