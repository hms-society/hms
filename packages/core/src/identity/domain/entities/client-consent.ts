import type { ConsentType } from '../structures'

export type ClientConsent = {
  readonly id: string
  readonly clientId: string
  readonly type: ConsentType
  readonly grantedAt: Date
  readonly revokedAt?: Date
}

export type ClientConsentCreation = Omit<ClientConsent, 'id'>
