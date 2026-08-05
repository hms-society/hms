import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-cbc'
const FALLBACK_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' // 32 bytes fallback key for development

function getEncryptionKey(): Buffer {
  const envKey = process.env.DB_ENCRYPTION_KEY
  if (envKey) {
    return Buffer.alloc(32, envKey, 'utf-8')
  }
  return Buffer.from(FALLBACK_KEY, 'utf-8')
}

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const key = getEncryptionKey()
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return encryptedText // Fallback to raw text if not formatted as iv:ciphertext
    const [ivHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const key = getEncryptionKey()
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (_error) {
    // Fallback if decryption fails (e.g. old unencrypted records)
    return encryptedText
  }
}
