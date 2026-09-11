import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const ROOT_DIRECTORY = resolve(SCRIPT_DIRECTORY, '..')
const PROMPTS_DIRECTORY = join(ROOT_DIRECTORY, 'documentation', 'prompts')
const SKILLS_DIRECTORY = join(ROOT_DIRECTORY, '.codex', 'skills')
const OUTPUT_DIRECTORIES = [
  join(ROOT_DIRECTORY, '.cursor', 'commands'),
  join(ROOT_DIRECTORY, '.claude', 'commands'),
  join(ROOT_DIRECTORY, '.opencode', 'commands'),
]

function toPosixPath(filePath) {
  return filePath.split('\\').join('/')
}

function relativePath(filePath) {
  return toPosixPath(relative(ROOT_DIRECTORY, filePath))
}

function getMarkdownFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => join(directory, fileName))
}

function getGeneratedSource(content) {
  const match = content.match(
    /^<!-- Auto-generated from (documentation\/prompts\/\S+).* -->$/m,
  )
  return match?.[1] ?? ''
}

function pathExists(filePath) {
  if (existsSync(filePath)) return true
  try {
    lstatSync(filePath)
    return true
  } catch {
    return false
  }
}

function cleanupStaleGeneratedArtifacts() {
  for (const outputDirectory of OUTPUT_DIRECTORIES) {
    for (const destination of getMarkdownFiles(outputDirectory)) {
      const stats = lstatSync(destination)
      if (stats.isSymbolicLink()) {
        const source = readlinkSync(destination)
        const isPromptLink = /^\.\.\/\.\.\/documentation\/prompts\/.+\.md$/.test(source)
        if (isPromptLink && !existsSync(destination)) {
          unlinkSync(destination)
          console.log(`removed: ${relativePath(destination)} (missing source)`)
        }
        continue
      }

      const source = getGeneratedSource(readFileSync(destination, 'utf8'))
      if (source && !existsSync(join(ROOT_DIRECTORY, source))) {
        unlinkSync(destination)
        console.log(`removed: ${relativePath(destination)} (missing source)`)
      }
    }
  }

  if (!existsSync(SKILLS_DIRECTORY)) return
  for (const skillName of readdirSync(SKILLS_DIRECTORY)) {
    const skillDirectory = join(SKILLS_DIRECTORY, skillName)
    const skillFile = join(skillDirectory, 'SKILL.md')
    if (!existsSync(skillFile)) continue

    const source = getGeneratedSource(readFileSync(skillFile, 'utf8'))
    if (!source || existsSync(join(ROOT_DIRECTORY, source))) continue

    unlinkSync(skillFile)
    try {
      rmdirSync(skillDirectory)
    } catch {
      // Keep non-empty skill directories intact.
    }
    console.log(`removed: ${relativePath(skillDirectory)} (missing source)`)
  }
}

function linkOrCopy(sourcePath, destinationPath) {
  if (pathExists(destinationPath)) unlinkSync(destinationPath)

  const relativeSource = toPosixPath(relative(dirname(destinationPath), sourcePath))
  try {
    symlinkSync(relativeSource, destinationPath)
    console.log(`linked:  ${relativePath(destinationPath)} -> ${relativeSource}`)
  } catch {
    const sourceRelative = relativePath(sourcePath)
    writeFileSync(
      destinationPath,
      `<!-- Auto-generated from ${sourceRelative} (symlink not available) -->\n\n${readFileSync(sourcePath, 'utf8')}`,
    )
    console.log(`copied:  ${relativePath(destinationPath)} <- ${sourceRelative}`)
  }
}

function extractDescription(sourcePath) {
  const lines = readFileSync(sourcePath, 'utf8').split(/\r?\n/)
  if (lines[0] !== '---') return ''

  const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---')
  if (frontmatterEnd === -1) return ''

  for (const line of lines.slice(1, frontmatterEnd)) {
    const match = line.match(/^description:\s*(.*)$/)
    if (match) return match[1]
  }
  return ''
}

function stripFrontmatter(sourcePath) {
  const lines = readFileSync(sourcePath, 'utf8').split(/\r?\n/)
  if (lines[0] !== '---') return lines.join('\n')

  const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---')
  if (frontmatterEnd === -1) return lines.join('\n')
  return lines.slice(frontmatterEnd + 1).join('\n')
}

function writeSkill(sourcePath, name) {
  const skillDirectory = join(SKILLS_DIRECTORY, name)
  const destinationPath = join(skillDirectory, 'SKILL.md')
  const description = extractDescription(sourcePath)
  const fields = ['---', `name: ${name}`]
  if (description) fields.push('description: >', `  ${description}`)
  fields.push('---', '', `<!-- Auto-generated from ${relativePath(sourcePath)} -->`, '')

  mkdirSync(skillDirectory, { recursive: true })
  writeFileSync(destinationPath, `${fields.join('\n')}${stripFrontmatter(sourcePath)}`)
  console.log(`skill:   ${relativePath(destinationPath)}`)
}

const promptFiles = getMarkdownFiles(PROMPTS_DIRECTORY)
if (!promptFiles.length) {
  throw new Error(`No prompts found in '${relativePath(PROMPTS_DIRECTORY)}/*.md'`)
}

for (const outputDirectory of OUTPUT_DIRECTORIES)
  mkdirSync(outputDirectory, { recursive: true })
mkdirSync(SKILLS_DIRECTORY, { recursive: true })
cleanupStaleGeneratedArtifacts()

for (const sourcePath of promptFiles) {
  const fileName = sourcePath.split(/[\\/]/).pop()
  let name = fileName.replace(/\.md$/, '')
  if (name.endsWith('-prompt')) name = name.slice(0, -'-prompt'.length)

  for (const outputDirectory of OUTPUT_DIRECTORIES) {
    linkOrCopy(sourcePath, join(outputDirectory, `${name}.md`))
  }

  writeSkill(sourcePath, name)
}
