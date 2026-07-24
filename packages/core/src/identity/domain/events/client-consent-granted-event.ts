import { Event } from '#shared/domain/events/event'
import type { ConsentType } from '../structures'

export class ClientConsentGrantedEvent extends Event<{
  clientConsentId: string
  clientId: string
  type: ConsentType
  grantedAt: Date
}> {
  static readonly _NAME = 'identity/client-consent.granted'

  constructor(payload: ClientConsentGrantedEvent['payload']) {
    super(ClientConsentGrantedEvent._NAME, payload)
  }
}
