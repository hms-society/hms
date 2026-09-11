import { createHmac } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(SCRIPT_DIRECTORY, '..')
const ENV_FILE = process.argv[2] ?? join(PROJECT_ROOT, '.env')

if (!existsSync(ENV_FILE)) {
  console.error(`Environment file not found: ${ENV_FILE}`)
  console.error(`Usage: ${process.argv[1]} [path-to-env-file]`)
  process.exit(1)
}

const values = {}

for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
  const trimmedLine = line.trim()
  if (!trimmedLine || trimmedLine.startsWith('#')) continue

  const separatorIndex = trimmedLine.indexOf('=')
  if (separatorIndex < 1) continue

  const key = trimmedLine.slice(0, separatorIndex).trim()
  let value = trimmedLine.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  values[key] = value
}

const secret = values.JWT_SECRET
if (!secret) throw new Error(`JWT_SECRET is missing from ${ENV_FILE}`)
if (secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters')

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

const issuedAt = Math.floor(Date.now() / 1000)
const expiresAt = issuedAt + 10 * 365 * 24 * 60 * 60

function createKey(role) {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({
    role,
    iss: 'supabase-demo',
    iat: issuedAt,
    exp: expiresAt,
  })
  const unsignedToken = `${header}.${payload}`
  const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url')

  return `${unsignedToken}.${signature}`
}

console.log(`# Generated with the JWT_SECRET from ${ENV_FILE}`)
console.log(`ANON_KEY=${createKey('anon')}`)
console.log(`SUPABASE_SERVICE_ROLE_KEY=${createKey('service_role')}`)
