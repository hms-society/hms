import { Event } from '#shared/domain/events/event'
import type { ConsentType } from '../structures/consent-type'

export class ConsentGrantedEvent extends Event<{
  personId: string
  consentType: ConsentType
  grantedAt: Date
}> {
  static readonly _NAME = 'identity/consent.granted'
  constructor(payload: ConsentGrantedEvent['payload']) {
    super(ConsentGrantedEvent._NAME, payload)
  }
}
