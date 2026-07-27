import type { ClientContact, ContactEndpoint } from '../domain/structures'

export interface ClientContactRepository {
  findByClientId(clientId: string): Promise<ClientContact | undefined>
  findByEndpoint(endpoint: ContactEndpoint): Promise<ClientContact | undefined>
  save(contact: ClientContact): Promise<void>
}
