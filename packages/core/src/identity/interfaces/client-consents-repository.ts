import type { ClientConsent, ClientConsentCreation } from '../domain/entities'

export interface ClientConsentsRepository {
  addMany(consents: ClientConsentCreation[]): Promise<ClientConsent[]>
  findActiveByClientIdAndType(
    clientId: string,
    type: ClientConsent['type'],
  ): Promise<ClientConsent | undefined>
  /** Returns undefined when another grant won the active unique constraint race. */
  add(consent: ClientConsentCreation): Promise<ClientConsent | undefined>
  findByClientId(clientId: string): Promise<ClientConsent[]>
}
