import type { ClientConsent, ClientConsentCreation } from '../domain/entities'

export interface ClientConsentsRepository {
  addMany(consents: ClientConsentCreation[]): Promise<ClientConsent[]>
  findByClientId(clientId: string): Promise<ClientConsent[]>
}
