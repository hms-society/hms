import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROMPTS_DIR = join(ROOT_DIR, 'documentation', 'prompts')
const SKILLS_DIR = join(ROOT_DIR, '.codex', 'skills')
const OUTPUT_DIRS = ['.cursor/commands', '.claude/commands', '.opencode/commands'].map(
  (directory) => join(ROOT_DIR, directory),
)
const GENERATED_PROMPT_PATTERN =
  /^<!-- Auto-generated from (documentation\/prompts\/[^ ]*).* -->$/m

function relativePath(filePath) {
  return relative(ROOT_DIR, filePath).split('\\').join('/')
}

function readGeneratedSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8').match(GENERATED_PROMPT_PATTERN)?.[1]
  } catch {
    return undefined
  }
}

function cleanupStaleGeneratedArtifacts() {
  for (const directory of OUTPUT_DIRS) {
    if (!existsSync(directory)) continue
    for (const filename of readdirSync(directory)) {
      if (!filename.endsWith('.md')) continue
      const destination = join(directory, filename)
      let isSymlink = false
      try {
        isSymlink = lstatSync(destination).isSymbolicLink()
      } catch {
        continue
      }

      if (isSymlink) {
        let target
        try {
          target = readlinkSync(destination)
        } catch {
          continue
        }
        if (
          target.startsWith('../../documentation/prompts/') &&
          !existsSync(resolve(directory, target))
        ) {
          rmSync(destination)
          console.log(`removed: ${relativePath(destination)} (missing source)`)
        }
        continue
      }

      const source = readGeneratedSource(destination)
      if (source && !existsSync(join(ROOT_DIR, source))) {
        rmSync(destination)
        console.log(`removed: ${relativePath(destination)} (missing source)`)
      }
    }
  }

  if (!existsSync(SKILLS_DIR)) return
  for (const skillName of readdirSync(SKILLS_DIR)) {
    const skillDirectory = join(SKILLS_DIR, skillName)
    const skillFile = join(skillDirectory, 'SKILL.md')
    const source = readGeneratedSource(skillFile)
    if (!source || existsSync(join(ROOT_DIR, source))) continue
    rmSync(skillFile)
    try {
      rmdirSync(skillDirectory)
    } catch {
      // Keep skill directories that contain files not managed by this script.
    }
    console.log(`removed: ${relativePath(skillDirectory)} (missing source)`)
  }
}

function getPromptDescription(content) {
  const lines = content.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return ''
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (end === -1) return ''
  const description = lines.slice(1, end).find((line) => /^description:\s*/.test(line))
  return description?.replace(/^description:\s*/, '') ?? ''
}

function getPromptBody(content) {
  const lines = content.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return content
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (end === -1) return content
  return lines.slice(end + 1).join('\n')
}

function linkOrCopy(source, destination) {
  const relativeSource = relative(dirname(destination), source).split('\\').join('/')
  rmSync(destination, { force: true })
  try {
    symlinkSync(relativeSource, destination)
    console.log(`linked:  ${relativePath(destination)} -> ${relativeSource}`)
  } catch {
    writeFileSync(
      destination,
      `<!-- Auto-generated from ${relativePath(source)} (symlink not available) -->\n\n${readFileSync(source, 'utf8')}`,
    )
    console.log(`copied:  ${relativePath(destination)} <- ${relativePath(source)}`)
  }
}

function writeSkill(source, name) {
  const skillDirectory = join(SKILLS_DIR, name)
  const destination = join(skillDirectory, 'SKILL.md')
  const content = readFileSync(source, 'utf8')
  const description = getPromptDescription(content)
  const body = getPromptBody(content)
  const descriptionLine = description ? `description: >\n  ${description}\n` : ''
  const skillContent =
    `---\nname: ${name}\n${descriptionLine}---\n\n` +
    `<!-- Auto-generated from ${relativePath(source)} -->\n\n${body}`

  mkdirSync(skillDirectory, { recursive: true })
  writeFileSync(destination, skillContent)
  console.log(`skill:   ${relativePath(destination)}`)
}

function main() {
  if (!existsSync(PROMPTS_DIR))
    throw new Error(`Prompt directory not found: ${PROMPTS_DIR}`)
  const prompts = readdirSync(PROMPTS_DIR)
    .filter((filename) => filename.endsWith('.md'))
    .sort()
    .map((filename) => join(PROMPTS_DIR, filename))
  if (!prompts.length) throw new Error("No prompts found in 'documentation/prompts/*.md'")

  for (const directory of OUTPUT_DIRS) mkdirSync(directory, { recursive: true })
  mkdirSync(SKILLS_DIR, { recursive: true })
  cleanupStaleGeneratedArtifacts()

  for (const source of prompts) {
    const filename = basename(source)
    const name = filename.replace(/\.md$/, '').replace(/-prompt$/, '')
    for (const directory of OUTPUT_DIRS) linkOrCopy(source, join(directory, `${name}.md`))
    writeSkill(source, name)
  }
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
