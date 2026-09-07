import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type {
  SensitivePayloadCipherProvider,
  SignatureOtpMacProvider,
  SignatureSecretVerifier,
} from '@hms/core/formalization/interfaces'

import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class FormalizationSignatureSecretVerifier implements SignatureSecretVerifier {
  constructor(private readonly env: EnvProvider) {}

  verify(input: { secret: string; verifier: string }): boolean {
    const expected = Buffer.from(input.verifier, 'hex')
    const actual = createHmac(
      'sha256',
      this.env.get('HMS_SIGNING_OTP_PEPPER') || 'local-development-pepper',
    )
      .update(input.secret)
      .digest()
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  }
}

@Injectable()
export class FormalizationSignatureSecretGenerator {
  generate(): string {
    return randomBytes(32).toString('base64url')
  }

  generateNumeric(length: number): string {
    const bytes = randomBytes(length)
    return Array.from(bytes, (byte) => String(byte % 10)).join('')
  }
}

@Injectable()
export class FormalizationSignatureOtpMacProvider implements SignatureOtpMacProvider {
  constructor(private readonly env: EnvProvider) {}

  create(input: { code: string; challengeId: string }): string {
    return (
      createHmac(
        'sha256',
        this.env.get('HMS_SIGNING_OTP_PEPPER') || 'local-development-pepper',
      )
        // SignatureSecretVerifier receives only the submitted code and verifier;
        // the challenge id is still part of the port for future key scoping, but
        // cannot be included until that verifier contract carries it as well.
        .update(input.code)
        .digest('hex')
    )
  }
}

@Injectable()
export class FormalizationSensitivePayloadCipherProvider
  implements SensitivePayloadCipherProvider
{
  private readonly algorithm = 'aes-256-gcm' as const

  constructor(private readonly env: EnvProvider) {}

  async encrypt(input: {
    plaintext: Uint8Array
    purpose: 'invitation_delivery' | 'otp_delivery' | 'provider_credential' | 'webhook'
    contextId: string
  }) {
    const key = this.key(input.purpose)
    const iv = randomBytes(12)
    const cipher = createCipheriv(this.algorithm, key, iv)
    cipher.setAAD(Buffer.from(`${input.contextId}:${input.purpose}`))
    const encrypted = Buffer.concat([cipher.update(input.plaintext), cipher.final()])
    const tag = cipher.getAuthTag()
    return {
      ciphertext: `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`,
      keyId: this.env.get('HMS_SIGNING_CIPHER_KEY_ID'),
    }
  }

  async decrypt(input: {
    ciphertext: string
    keyId: string
    purpose: 'invitation_delivery' | 'otp_delivery' | 'provider_credential' | 'webhook'
    contextId: string
  }) {
    if (input.keyId !== this.env.get('HMS_SIGNING_CIPHER_KEY_ID'))
      throw new Error('Unknown signing cipher key.')
    const [encodedIv, encodedTag, encodedPayload] = input.ciphertext.split('.')
    if (!encodedIv || !encodedTag || !encodedPayload)
      throw new Error('Malformed signing ciphertext.')
    const key = this.key(input.purpose)
    const iv = Buffer.from(encodedIv, 'base64url')
    const payload = Buffer.from(encodedPayload, 'base64url')
    const decipher = createDecipheriv(this.algorithm, key, iv)
    decipher.setAAD(Buffer.from(`${input.contextId}:${input.purpose}`))
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))
    return Uint8Array.from(Buffer.concat([decipher.update(payload), decipher.final()]))
  }

  private key(purpose: string): Buffer {
    return createHash('sha256')
      .update(
        `${this.env.get('HMS_SIGNING_CIPHER_KEY_ID')}:${purpose}:${this.env.get('HMS_SIGNING_OTP_PEPPER')}`,
      )
      .digest()
  }
}
