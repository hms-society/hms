import type { ConsentType } from '../structures'

export type ClientConsent = {
  id: string
  clientId: string
  type: ConsentType
  grantedAt: Date
  revokedAt?: Date
}
