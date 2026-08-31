import type { Client, ClientCreation, ClientUpdate } from '../domain/entities'
import type { TaxId } from '../domain/structures'

export interface ClientsRepository {
  add(client: ClientCreation): Promise<Client | undefined>
  addMany(clients: ClientCreation[]): Promise<Client[]>
  removeAll(): Promise<void>
  findById(clientId: string): Promise<Client | undefined>
  findByTaxId(taxId: TaxId): Promise<Client | undefined>
  findByPhone(phone: string): Promise<Client[]>
  replace(clientId: string, changes: ClientUpdate, auditLogs: any[]): Promise<Client | undefined>
  findAll(params: { page: number; limit: number; search?: string }): Promise<{
    data: {
      client: Client
      intakeCount: number
      latestOrigin: string | null
    }[]
    total: number
  }>
}
