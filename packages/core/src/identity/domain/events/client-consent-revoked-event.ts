import { Event } from '#shared/domain/events/event'
import type { ConsentType } from '../structures'

export class ClientConsentRevokedEvent extends Event<{
  clientConsentId: string
  clientId: string
  type: ConsentType
  revokedAt: Date
}> {
  static readonly _NAME = 'identity/client-consent.revoked'

  constructor(payload: ClientConsentRevokedEvent['payload']) {
    super(ClientConsentRevokedEvent._NAME, payload)
  }
}
