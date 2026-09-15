import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'
import type { CryptoProvider as CryptoProviderContract } from '@hms/core/shared/interfaces'

import { EnvProvider } from '@/shared/provision/env/env-provider'

const ALGORITHM = 'aes-256-cbc'
const FALLBACK_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'

@Injectable()
export class CryptoProvider implements CryptoProviderContract {
  constructor(@Inject(EnvProvider) private readonly envProvider: EnvProvider) {}

  encrypt(text: string): string {
    const iv = randomBytes(16)
    const key = this.getEncryptionKey()
    const cipher = createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  }

  decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':')
      if (parts.length !== 2) return encryptedText

      const [ivHex, encrypted] = parts
      const iv = Buffer.from(ivHex, 'hex')
      const decipher = createDecipheriv(ALGORITHM, this.getEncryptionKey(), iv)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (_error) {
      return encryptedText
    }
  }

  private getEncryptionKey(): Buffer {
    const envKey = this.envProvider.get('DB_ENCRYPTION_KEY')
    if (envKey) return Buffer.alloc(32, envKey, 'utf-8')
    return Buffer.from(FALLBACK_KEY, 'utf-8')
  }
}
