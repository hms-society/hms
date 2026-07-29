import type { Client, ClientCreation } from '../domain/entities'
import type { TaxId } from '../domain/structures'

export interface ClientsRepository {
  /** Returns undefined when the tax identifier collides with an existing client. */
  add(client: ClientCreation): Promise<Client | undefined>
  addMany(clients: ClientCreation[]): Promise<Client[]>
  removeAll(): Promise<void>
  findById(clientId: string): Promise<Client | undefined>
  findByTaxId(taxId: TaxId): Promise<Client | undefined>
  findByPhone(phone: string): Promise<Client[]>
}
