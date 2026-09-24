import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(SCRIPT_DIR, '..')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf8')
  const env = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }

  return env
}

const rootEnv = loadEnvFile(join(PROJECT_ROOT, '.env'))
const serverEnv = loadEnvFile(join(PROJECT_ROOT, 'apps', 'server', '.env'))
const env = { ...rootEnv, ...serverEnv, ...process.env }
const port = env.HMS_SERVER_APP_PORT || '3333'
const DEFAULT_NGROK_DOMAIN = 'buckle-stinger-swoop.ngrok-free.dev'
const ngrokDomain = env.NGROK_DOMAIN || DEFAULT_NGROK_DOMAIN
const args = ['http']

if (ngrokDomain.trim() && !ngrokDomain.includes('your-static-subdomain')) {
  args.push(`--url=${ngrokDomain.trim()}`)
  console.log(
    `[ngrok] Starting tunnel with static domain: ${ngrokDomain.trim()} on port ${port}...`,
  )
} else {
  console.log(`[ngrok] Starting standard tunnel on port ${port}...`)
}

args.push(port)
const child = spawn('ngrok', args, { stdio: 'inherit' })
let didSpawnFail = false

child.on('error', (error) => {
  didSpawnFail = true
  if (error.code === 'ENOENT') {
    console.error(
      '\n[error] ngrok CLI is not installed or not found in PATH.\n' +
        'Please install ngrok: https://ngrok.com/download or run `npm install -g ngrok` / `brew install ngrok`.\n',
    )
  } else {
    console.error('[error] Failed to start ngrok:', error.message)
  }
  process.exitCode = 1
})

child.on('exit', (code) => {
  if (!didSpawnFail) process.exitCode = code ?? 0
})
