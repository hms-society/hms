import { createHmac } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { SignatureSecretHasher } from '@hms/core/formalization/interfaces'

import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class FormalizationSignatureSecretHasher implements SignatureSecretHasher {
  constructor(private readonly env: EnvProvider) {}

  hash(value: string): string {
    const configuredPepper = this.env.get('HMS_SIGNING_OTP_PEPPER')
    const pepper = configuredPepper || this.getLocalDevelopmentPepper()
    return createHmac('sha256', pepper).update(value).digest('hex')
  }

  private getLocalDevelopmentPepper(): string {
    if (this.env.get('HMS_SERVER_APP_MODE') === 'dev') {
      return 'local-development-pepper'
    }

    throw new Error('HMS_SIGNING_OTP_PEPPER is required outside development.')
  }
}
