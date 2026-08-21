import type { ConsentType } from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type ClientConsent = Entity & {
  clientId: string
  type: ConsentType
  grantedAt: Date
  revokedAt?: Date
}

export type ClientConsentCreation = Omit<ClientConsent, 'id'>
