import type { Client, ClientCreation } from '../domain/entities'
import type { TaxId } from '../domain/structures'

export interface ClientsRepository {
  add(client: ClientCreation): Promise<Client>
  addMany(clients: ClientCreation[]): Promise<Client[]>
  findById(clientId: string): Promise<Client | undefined>
  findByTaxId(taxId: TaxId): Promise<Client | undefined>
  findByPhone(phone: string): Promise<Client[]>
}
