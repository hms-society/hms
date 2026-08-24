import type {
  ClientListProjection,
  ResponsibleListProjection,
} from '../../identity/domain/structures'
import type {
  IntakeClientsRepository,
  IntakeResponsiblesRepository,
} from '../../identity/interfaces'
import {
  ContactChannel,
  IntakeListStatus,
  IntakeOrigin,
  type IntakeListItem,
  type IntakeListQuery,
  type IntakeListRow,
} from '../domain/structures'
import type { IntakeListRepository, IntakeListResponse } from '../interfaces'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export type ListIntakesUseCaseRequest = Omit<
  IntakeListQuery,
  | 'status'
  | 'origin'
  | 'contactChannel'
  | 'responsibleId'
  | 'registeredFrom'
  | 'registeredTo'
> & {
  readonly status?: string
  readonly origin?: string
  readonly contactChannel?: string
  readonly responsibleId?: string
  readonly registeredFrom?: string
  readonly registeredTo?: string
}

export class ListIntakesUseCase {
  constructor(
    private readonly intakeListRepository: IntakeListRepository,
    private readonly intakeClientsRepository: IntakeClientsRepository,
    private readonly intakeResponsiblesRepository: IntakeResponsiblesRepository,
  ) {}

  async execute(
    query: ListIntakesUseCaseRequest = {},
  ): Promise<IntakeListResponse<IntakeListItem>> {
    const normalizedQuery = await this.normalizeQuery(query)
    const result = await this.intakeListRepository.list(normalizedQuery)
    const clientIds = this.unique(result.items.map((item) => item.clientId))
    const responsibleIds = this.unique(result.items.map((item) => item.responsibleId))
    const [clients, responsibles] = await Promise.all([
      this.intakeClientsRepository.findClientsByIds(clientIds),
      this.intakeResponsiblesRepository.findResponsiblesByIds(responsibleIds),
    ])

    return {
      ...result,
      items: this.hydrateItems(result.items, clients, responsibles),
    }
  }

  private async normalizeQuery(
    query: ListIntakesUseCaseRequest,
  ): Promise<IntakeListQuery> {
    const search = this.normalizeText(query.search)
    const clientIds = search
      ? await this.intakeClientsRepository.findClientIdsBySearch(search)
      : query.clientIds
        ? this.unique(query.clientIds)
        : undefined
    const dateRange = this.normalizeDateRange(query.registeredFrom, query.registeredTo)

    return {
      ...(search ? { search } : {}),
      ...(this.isPublicStatus(query.status) ? { status: query.status } : {}),
      ...(clientIds ? { clientIds } : {}),
      ...(this.normalizeText(query.responsibleId)
        ? { responsibleId: this.normalizeText(query.responsibleId) }
        : {}),
      ...(this.isEnumValue(query.origin, IntakeOrigin) ? { origin: query.origin } : {}),
      ...(this.isEnumValue(query.contactChannel, ContactChannel)
        ? { contactChannel: query.contactChannel }
        : {}),
      ...(dateRange.registeredFrom ? { registeredFrom: dateRange.registeredFrom } : {}),
      ...(dateRange.registeredTo ? { registeredTo: dateRange.registeredTo } : {}),
      page: this.normalizePage(query.page),
      pageSize: this.normalizePageSize(query.pageSize),
    }
  }

  private hydrateItems(
    rows: readonly IntakeListRow[],
    clients: readonly ClientListProjection[],
    responsibles: readonly ResponsibleListProjection[],
  ): readonly IntakeListItem[] {
    const clientsById = new Map(clients.map((client) => [client.clientId, client]))
    const responsiblesById = new Map(
      responsibles.map((responsible) => [responsible.responsibleId, responsible]),
    )

    return rows.flatMap((row) => {
      const client =
        clientsById.get(row.clientId) ??
        ({
          clientId: row.clientId,
          name: 'Cliente não encontrado',
          maskedTaxId: '—',
        } satisfies ClientListProjection)
      const responsible =
        responsiblesById.get(row.responsibleId) ??
        ({
          responsibleId: row.responsibleId,
          professionalName: 'Atendente não encontrado',
        } satisfies ResponsibleListProjection)

      return [
        {
          intakeId: row.intakeId,
          displayId: this.formatDisplayId(row.sequenceNumber),
          createdAt: row.createdAt,
          client,
          responsible,
          ...(row.demandNotes ? { demandNotes: row.demandNotes } : {}),
          origin: row.origin,
          contactChannel: row.contactChannel,
          status: row.status,
        },
      ]
    })
  }

  private formatDisplayId(sequenceNumber: number): string {
    return `INT-${String(sequenceNumber).padStart(4, '0')}`
  }

  private normalizeText(value?: string): string | undefined {
    const normalizedValue = value?.trim()
    return normalizedValue || undefined
  }

  private normalizePage(page?: number): number {
    if (!Number.isFinite(page) || !page || page < 1) return DEFAULT_PAGE

    return Math.floor(page)
  }

  private normalizePageSize(pageSize?: number): number {
    if (!Number.isFinite(pageSize) || !pageSize || pageSize < 1) {
      return DEFAULT_PAGE_SIZE
    }

    return Math.min(MAX_PAGE_SIZE, Math.floor(pageSize))
  }

  private normalizeDateRange(
    registeredFrom?: string,
    registeredTo?: string,
  ): { registeredFrom?: string; registeredTo?: string } {
    const normalizedFrom = this.isDateOnly(registeredFrom) ? registeredFrom : undefined
    const normalizedTo = this.isDateOnly(registeredTo) ? registeredTo : undefined

    if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) return {}

    return { registeredFrom: normalizedFrom, registeredTo: normalizedTo }
  }

  private isDateOnly(value?: string): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }

  private isPublicStatus(value?: string): value is IntakeListQuery['status'] {
    return this.isEnumValue(value, IntakeListStatus)
  }

  private isEnumValue<T extends Record<string, string>>(
    value: string | undefined,
    values: T,
  ): value is T[keyof T] {
    return value !== undefined && Object.values(values).includes(value)
  }

  private unique(values: readonly string[]): readonly string[] {
    return [...new Set(values)]
  }
}
