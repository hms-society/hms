import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const ROOT_DIRECTORY = resolve(SCRIPT_DIRECTORY, '..')
const SOURCE_DIRECTORY = join(ROOT_DIRECTORY, 'documentation', 'agents')
const CODEX_DIRECTORY = join(ROOT_DIRECTORY, '.codex')
const CODEX_AGENTS_DIRECTORY = join(CODEX_DIRECTORY, 'agents')
const OPENCODE_AGENTS_DIRECTORY = join(ROOT_DIRECTORY, '.opencode', 'agents')
const CLAUDE_AGENTS_DIRECTORY = join(ROOT_DIRECTORY, '.claude', 'agents')
const CODEX_CONFIG = join(CODEX_DIRECTORY, 'config.toml')
const BEGIN_MARKER = '# BEGIN GENERATED AGENTS - scripts/sync-agents.mjs'
const END_MARKER = '# END GENERATED AGENTS - scripts/sync-agents.mjs'
const LEGACY_BEGIN_MARKER = '# BEGIN GENERATED AGENTS - scripts/sync-agents.sh'
const LEGACY_END_MARKER = '# END GENERATED AGENTS - scripts/sync-agents.sh'
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const READ_ONLY_AGENTS = new Set(['implementation-reviewer-agent', 'spec-reviewer-agent'])

function toPosixPath(filePath) {
  return filePath.split('\\').join('/')
}

function relativePath(filePath) {
  return toPosixPath(relative(ROOT_DIRECTORY, filePath))
}

function stripMetadataQuotes(value) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function parseAgent(filePath) {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  if (!lines.length || lines[0].trim() !== '---') {
    throw new Error(`Missing YAML frontmatter in ${relativePath(filePath)}`)
  }

  const frontmatterEnd = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---',
  )
  if (frontmatterEnd === -1) {
    throw new Error(`Unclosed YAML frontmatter in ${relativePath(filePath)}`)
  }

  const metadata = {}
  for (const line of lines.slice(1, frontmatterEnd)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) continue
    const key = line.slice(0, separatorIndex).trim()
    const value = stripMetadataQuotes(line.slice(separatorIndex + 1))
    metadata[key] = value
  }

  const name = metadata.name ?? ''
  const description = metadata.description ?? ''
  const expectedName = filePath.split(/[\\/]/).pop().replace(/\.md$/, '')

  if (!name) throw new Error(`Missing name in ${relativePath(filePath)}`)
  if (!description) throw new Error(`Missing description in ${relativePath(filePath)}`)
  if (name !== expectedName) {
    throw new Error(
      `Agent name '${name}' must match filename '${expectedName}' in ${relativePath(filePath)}`,
    )
  }
  if (!NAME_PATTERN.test(name))
    throw new Error(`Invalid agent name '${name}' in ${relativePath(filePath)}`)

  const body = `${lines
    .slice(frontmatterEnd + 1)
    .join('\n')
    .trim()}\n`
  if (!body.trim())
    throw new Error(`Missing agent instructions in ${relativePath(filePath)}`)

  return { name, description, body, filePath }
}

function isReadOnly(name) {
  return READ_ONLY_AGENTS.has(name)
}

function generatedMarker(filePath) {
  return `<!-- Auto-generated from ${relativePath(filePath)} -->`
}

function writeIfChanged(filePath, content, managedToken) {
  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf8')
    if (existing === content) {
      console.log(`unchanged: ${relativePath(filePath)}`)
      return
    }
    if (managedToken && !existing.includes(managedToken)) {
      throw new Error(`Refusing to overwrite unmanaged file: ${relativePath(filePath)}`)
    }
  }

  writeFileSync(filePath, content)
  console.log(`synced:    ${relativePath(filePath)}`)
}

function cleanupStale(directory, suffix, validNames) {
  if (!existsSync(directory)) return

  for (const entry of readdirSync(directory)) {
    if (!entry.endsWith(suffix)) continue
    const filePath = join(directory, entry)
    const name = entry.slice(0, -suffix.length)

    if (validNames.has(name)) continue

    try {
      const sample = readFileSync(filePath, 'utf8').slice(0, 2048)
      if (!sample.includes('Auto-generated from documentation/agents/')) continue
      unlinkSync(filePath)
      console.log(`removed:   ${relativePath(filePath)}`)
    } catch {
      // Ignore unreadable or non-file entries, matching the original helper.
    }
  }
}

function countOccurrences(value, token) {
  return value.split(token).length - 1
}

function removeGeneratedBlock(config, beginMarker, endMarker) {
  const beginCount = countOccurrences(config, beginMarker)
  const endCount = countOccurrences(config, endMarker)
  if (beginCount !== endCount) {
    throw new Error(`Unbalanced generated-agent markers in ${relativePath(CODEX_CONFIG)}`)
  }
  if (beginCount === 0) return config

  const beginIndex = config.indexOf(beginMarker)
  const endIndex = config.indexOf(endMarker, beginIndex + beginMarker.length)
  const before = config.slice(0, beginIndex).trimEnd()
  const after = config.slice(endIndex + endMarker.length).replace(/^\n+/, '')
  return before + after
}

if (!existsSync(SOURCE_DIRECTORY)) {
  console.error(`Agent source directory not found: ${SOURCE_DIRECTORY}`)
  process.exit(1)
}

mkdirSync(CODEX_AGENTS_DIRECTORY, { recursive: true })
mkdirSync(OPENCODE_AGENTS_DIRECTORY, { recursive: true })
mkdirSync(CLAUDE_AGENTS_DIRECTORY, { recursive: true })

const agents = readdirSync(SOURCE_DIRECTORY)
  .filter((fileName) => fileName.endsWith('-agent.md'))
  .sort()
  .map((fileName) => parseAgent(join(SOURCE_DIRECTORY, fileName)))

if (!agents.length)
  throw new Error('No agent definitions found in documentation/agents/*-agent.md')

const validNames = new Set(agents.map(({ name }) => name))
cleanupStale(CODEX_AGENTS_DIRECTORY, '.toml', validNames)
cleanupStale(OPENCODE_AGENTS_DIRECTORY, '.md', validNames)
cleanupStale(CLAUDE_AGENTS_DIRECTORY, '.md', validNames)

const codexRoles = [BEGIN_MARKER]

for (const { name, description, body, filePath } of agents) {
  const sourceRelative = relativePath(filePath)
  const codexPromptRelative = toPosixPath(join('..', '..', sourceRelative))
  const sandboxMode = isReadOnly(name) ? 'read-only' : 'workspace-write'

  const codexAgent =
    `# Auto-generated from ${sourceRelative}\n` +
    `model_instructions_file = ${JSON.stringify(codexPromptRelative)}\n` +
    `sandbox_mode = ${JSON.stringify(sandboxMode)}\n`
  writeIfChanged(
    join(CODEX_AGENTS_DIRECTORY, `${name}.toml`),
    codexAgent,
    'Auto-generated from documentation/agents/',
  )

  codexRoles.push(
    '',
    `[agents.${JSON.stringify(name)}]`,
    `description = ${JSON.stringify(description)}`,
    `config_file = ${JSON.stringify(`agents/${name}.toml`)}`,
  )

  let opencodePermissions = '  edit: allow\n  bash: allow\n  task: allow'
  if (isReadOnly(name)) opencodePermissions = '  edit: deny\n  bash: deny\n  task: deny'
  else if (name === 'builder-agent')
    opencodePermissions = '  edit: allow\n  bash: allow\n  task: deny'

  const opencodeAgent =
    '---\n' +
    `description: ${JSON.stringify(description)}\n` +
    'mode: subagent\n' +
    'permission:\n' +
    `${opencodePermissions}\n` +
    '---\n\n' +
    `${generatedMarker(filePath)}\n\n` +
    body
  writeIfChanged(
    join(OPENCODE_AGENTS_DIRECTORY, `${name}.md`),
    opencodeAgent,
    'Auto-generated from documentation/agents/',
  )

  const claudeFields = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
  ]
  if (isReadOnly(name))
    claudeFields.push('tools: Read, Glob, Grep', 'permissionMode: plan')
  else if (name === 'builder-agent') claudeFields.push('disallowedTools: Agent')
  claudeFields.push('---', '', generatedMarker(filePath), '', body.trimEnd(), '')
  writeIfChanged(
    join(CLAUDE_AGENTS_DIRECTORY, `${name}.md`),
    `${claudeFields.join('\n')}`,
    'Auto-generated from documentation/agents/',
  )
}

codexRoles.push('', END_MARKER)
const managedBlock = `${codexRoles.join('\n')}\n`

let existingConfig = existsSync(CODEX_CONFIG) ? readFileSync(CODEX_CONFIG, 'utf8') : ''
existingConfig = removeGeneratedBlock(existingConfig, BEGIN_MARKER, END_MARKER)
existingConfig = removeGeneratedBlock(
  existingConfig,
  LEGACY_BEGIN_MARKER,
  LEGACY_END_MARKER,
)

let newConfig = existingConfig.trimEnd()
if (newConfig) newConfig += '\n\n'
newConfig += managedBlock
writeIfChanged(CODEX_CONFIG, newConfig)
