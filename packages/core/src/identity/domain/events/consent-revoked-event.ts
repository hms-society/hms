import { Event } from '#shared/domain/events/event'
import type { ConsentType } from '../structures/consent-type'

export class ConsentRevokedEvent extends Event<{
  personId: string
  consentType: ConsentType
  revokedAt: Date
}> {
  static readonly _NAME = 'identity/consent.revoked'
  constructor(payload: ConsentRevokedEvent['payload']) {
    super(ConsentRevokedEvent._NAME, payload)
  }
}
