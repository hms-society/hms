import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDirectory = dirname(fileURLToPath(import.meta.url))

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim()
      let val = trimmed.substring(eqIdx + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }
  return env
}

const rootEnv = loadEnvFile(join(scriptsDirectory, '..', '.env'))
const serverEnv = loadEnvFile(join(scriptsDirectory, '..', 'apps', 'server', '.env'))

const env = { ...rootEnv, ...serverEnv, ...process.env }

const port = env.HMS_SERVER_APP_PORT

if (!port) {
  console.error('[error] HMS_SERVER_APP_PORT must be set before starting ngrok.')
  process.exit(1)
}
const DEFAULT_NGROK_DOMAIN = 'buckle-stinger-swoop.ngrok-free.dev'
const ngrokDomain = env.NGROK_DOMAIN || DEFAULT_NGROK_DOMAIN

const args = ['http']

if (
  ngrokDomain &&
  ngrokDomain.trim() !== '' &&
  !ngrokDomain.includes('your-static-subdomain')
) {
  args.push(`--url=${ngrokDomain.trim()}`)
  console.log(
    `[ngrok] Starting tunnel with static domain: ${ngrokDomain.trim()} on port ${port}...`,
  )
} else {
  console.log(`[ngrok] Starting standard tunnel on port ${port}...`)
}

args.push(port)

const child = spawn('ngrok', args, { stdio: 'inherit', shell: true })

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error(
      '\n[error] ngrok CLI is not installed or not found in PATH.\n' +
        'Please install ngrok: https://ngrok.com/download or run `npm install -g ngrok` / `brew install ngrok`.\n',
    )
  } else {
    console.error('[error] Failed to start ngrok:', err.message)
  }
  process.exit(1)
})

child.on('exit', (code) => {
  process.exit(code || 0)
})
