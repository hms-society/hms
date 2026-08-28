import type { ClientsRepository } from '../interfaces/clients-repository'

export interface ListClientsRequest {
  page: number
  limit: number
  search?: string
}

export type ClientRelationalStatus = 'Cliente' | 'Interessado' | 'Potencial'

export interface ListClientsResponseItem {
  id: string
  type: 'natural' | 'legal'
  name: string | null
  legalName: string | null
  tradeName: string | null
  taxId: { type: 'cpf' | 'cnpj'; value: string }
  phone: string | null
  email: string | null
  status: ClientRelationalStatus
  intakesCount: number
  origin: string
}

export interface ListClientsResponse {
  data: ListClientsResponseItem[]
  total: number
  page: number
  limit: number
}

export class ListClientsUseCase {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async execute(request: ListClientsRequest): Promise<ListClientsResponse> {
    const { page, limit, search } = request

    const result = await this.clientsRepository.findAll({
      page,
      limit,
      search,
    })

    const mappedData: ListClientsResponseItem[] = result.data.map((record) => {
      const { client, intakeCount, latestOrigin } = record

      let status: ClientRelationalStatus = 'Potencial'
      if (intakeCount > 1) {
        status = 'Cliente'
      } else if (intakeCount === 1) {
        status = 'Interessado'
      }

      return {
        id: client.id,
        type: client.type,
        name: client.type === 'natural' ? client.name : null,
        legalName: client.type === 'legal' ? client.legalName : null,
        tradeName: client.type === 'legal' ? (client.tradeName ?? null) : null,
        taxId: client.taxId,
        phone: client.phone ?? null,
        email: client.email ?? null,
        status,
        intakesCount: intakeCount,
        origin: latestOrigin ?? 'Direta HMS',
      }
    })

    return {
      data: mappedData,
      total: result.total,
      page,
      limit,
    }
  }
}
