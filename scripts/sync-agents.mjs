import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR = join(ROOT_DIR, 'documentation', 'agents')
const CODEX_DIR = join(ROOT_DIR, '.codex')
const CODEX_AGENTS_DIR = join(CODEX_DIR, 'agents')
const OPENCODE_AGENTS_DIR = join(ROOT_DIR, '.opencode', 'agents')
const CLAUDE_AGENTS_DIR = join(ROOT_DIR, '.claude', 'agents')
const CODEX_CONFIG = join(CODEX_DIR, 'config.toml')
const BEGIN_MARKER = '# BEGIN GENERATED AGENTS - scripts/sync-agents.mjs'
const END_MARKER = '# END GENERATED AGENTS - scripts/sync-agents.mjs'
const LEGACY_BEGIN_MARKER = '# BEGIN GENERATED AGENTS - scripts/sync-agents.sh'
const LEGACY_END_MARKER = '# END GENERATED AGENTS - scripts/sync-agents.sh'
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function toRelativePath(filePath) {
  return relative(ROOT_DIR, filePath).split('\\').join('/')
}

function parseAgent(filePath) {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  const relativePath = toRelativePath(filePath)
  if (!lines.length || lines[0].trim() !== '---') {
    throw new Error(`Missing YAML frontmatter in ${relativePath}`)
  }

  const frontmatterEnd = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---',
  )
  if (frontmatterEnd === -1)
    throw new Error(`Unclosed YAML frontmatter in ${relativePath}`)

  const metadata = {}
  for (const line of lines.slice(1, frontmatterEnd)) {
    if (!line.includes(':')) continue
    const separatorIndex = line.indexOf(':')
    const key = line.slice(0, separatorIndex).trim()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    metadata[key] = value
  }

  const name = metadata.name ?? ''
  const description = metadata.description ?? ''
  const expectedName = basename(filePath, '.md')
  if (!name) throw new Error(`Missing name in ${relativePath}`)
  if (!description) throw new Error(`Missing description in ${relativePath}`)
  if (name !== expectedName) {
    throw new Error(
      `Agent name '${name}' must match filename '${expectedName}' in ${relativePath}`,
    )
  }
  if (!NAME_PATTERN.test(name))
    throw new Error(`Invalid agent name '${name}' in ${relativePath}`)

  const body = `${lines
    .slice(frontmatterEnd + 1)
    .join('\n')
    .trim()}\n`
  if (!body.trim()) throw new Error(`Missing agent instructions in ${relativePath}`)

  return { name, description, body, filePath }
}

function isReadOnly(name) {
  return name === 'searcher-agent' || name === 'reviewer-agent'
}

function generatedMarker(source) {
  return `<!-- Auto-generated from ${toRelativePath(source)} -->`
}

function writeIfChanged(filePath, content, managedToken) {
  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf8')
    if (existing === content) {
      console.log(`unchanged: ${toRelativePath(filePath)}`)
      return
    }
    if (managedToken && !existing.includes(managedToken)) {
      throw new Error(`Refusing to overwrite unmanaged file: ${toRelativePath(filePath)}`)
    }
  }
  writeFileSync(filePath, content)
  console.log(`synced:    ${toRelativePath(filePath)}`)
}

function cleanupStale(directory, suffix, validNames) {
  if (!existsSync(directory)) return
  for (const filename of readdirSync(directory)) {
    if (!filename.endsWith(suffix)) continue
    const filePath = join(directory, filename)
    if (validNames.has(filename.slice(0, -suffix.length))) continue
    let sample
    try {
      sample = readFileSync(filePath, 'utf8').slice(0, 2048)
    } catch {
      continue
    }
    if (!sample.includes('Auto-generated from documentation/agents/')) continue
    unlinkSync(filePath)
    console.log(`removed:   ${toRelativePath(filePath)}`)
  }
}

function createCodexRole(agent) {
  const sourceRelative = toRelativePath(agent.filePath)
  const promptRelative = `../../${sourceRelative}`
  const sandboxMode = isReadOnly(agent.name) ? 'read-only' : 'workspace-write'
  return `# Auto-generated from ${sourceRelative}\nmodel_instructions_file = ${JSON.stringify(promptRelative)}\nsandbox_mode = ${JSON.stringify(sandboxMode)}\n`
}

function createOpenCodeAgent(agent) {
  const readOnly = isReadOnly(agent.name)
  const isBuilder = agent.name === 'builder-agent'
  const permissions = readOnly
    ? '  edit: deny\n  bash: deny\n  task: deny'
    : isBuilder
      ? '  edit: allow\n  bash: allow\n  task: deny'
      : '  edit: allow\n  bash: allow\n  task: allow'
  return (
    '---\n' +
    `description: ${JSON.stringify(agent.description)}\n` +
    'mode: subagent\n' +
    `permission:\n${permissions}\n` +
    '---\n\n' +
    `${generatedMarker(agent.filePath)}\n\n` +
    agent.body
  )
}

function createClaudeAgent(agent) {
  const fields = [
    '---',
    `name: ${agent.name}`,
    `description: ${JSON.stringify(agent.description)}`,
  ]
  if (isReadOnly(agent.name))
    fields.push('tools: Read, Glob, Grep', 'permissionMode: plan')
  else if (agent.name === 'builder-agent') fields.push('disallowedTools: Agent')
  fields.push('---', '', generatedMarker(agent.filePath), '', agent.body.trimEnd(), '')
  return fields.join('\n')
}

function buildCodexConfig(agents, existingConfig) {
  let config = existingConfig
  for (const [beginMarker, endMarker] of [
    [BEGIN_MARKER, END_MARKER],
    [LEGACY_BEGIN_MARKER, LEGACY_END_MARKER],
  ]) {
    if (config.split(beginMarker).length !== config.split(endMarker).length) {
      throw new Error(
        `Unbalanced generated-agent markers in ${toRelativePath(CODEX_CONFIG)}`,
      )
    }
    if (!config.includes(beginMarker)) continue
    const [before, remainder] = config.split(beginMarker)
    const [, after] = remainder.split(endMarker)
    config = before.trimEnd() + after.replace(/^\n+/, '')
  }

  const roles = [BEGIN_MARKER]
  for (const agent of agents) {
    roles.push(
      '',
      `[agents.${JSON.stringify(agent.name)}]`,
      `description = ${JSON.stringify(agent.description)}`,
      `config_file = ${JSON.stringify(`agents/${agent.name}.toml`)}`,
    )
  }
  roles.push('', END_MARKER)

  let result = config.trimEnd()
  if (result) result += '\n\n'
  return `${result}${roles.join('\n')}\n`
}

function main() {
  if (!existsSync(SOURCE_DIR))
    throw new Error(`Agent source directory not found: ${SOURCE_DIR}`)
  for (const directory of [CODEX_AGENTS_DIR, OPENCODE_AGENTS_DIR, CLAUDE_AGENTS_DIR]) {
    mkdirSync(directory, { recursive: true })
  }

  const agents = readdirSync(SOURCE_DIR)
    .filter((filename) => filename.endsWith('-agent.md'))
    .sort()
    .map((filename) => parseAgent(join(SOURCE_DIR, filename)))
  if (!agents.length)
    throw new Error('No agent definitions found in documentation/agents/*-agent.md')

  const validNames = new Set(agents.map(({ name }) => name))
  cleanupStale(CODEX_AGENTS_DIR, '.toml', validNames)
  cleanupStale(OPENCODE_AGENTS_DIR, '.md', validNames)
  cleanupStale(CLAUDE_AGENTS_DIR, '.md', validNames)

  for (const agent of agents) {
    const managedToken = 'Auto-generated from documentation/agents/'
    writeIfChanged(
      join(CODEX_AGENTS_DIR, `${agent.name}.toml`),
      createCodexRole(agent),
      managedToken,
    )
    writeIfChanged(
      join(OPENCODE_AGENTS_DIR, `${agent.name}.md`),
      createOpenCodeAgent(agent),
      managedToken,
    )
    writeIfChanged(
      join(CLAUDE_AGENTS_DIR, `${agent.name}.md`),
      createClaudeAgent(agent),
      managedToken,
    )
  }

  const existingConfig = existsSync(CODEX_CONFIG)
    ? readFileSync(CODEX_CONFIG, 'utf8')
    : ''
  writeIfChanged(CODEX_CONFIG, buildCodexConfig(agents, existingConfig))
  console.log('Configured agents for Codex, OpenCode and Claude Code.')
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
