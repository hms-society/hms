import type { ConsentType } from './consent-type'

export type PersonConsent = {
  consentType: ConsentType
  grantedAt: Date
  revokedAt?: Date
}
