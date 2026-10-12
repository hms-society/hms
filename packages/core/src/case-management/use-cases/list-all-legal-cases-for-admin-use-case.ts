import type { Client } from '#identity/domain/entities'
import type { LegalArea, LegalTopic } from '#legal-catalog/domain/entities'
import type { CaseEligibleCollaborator } from '../domain/structures'
import type { LegalCaseOperationalRecord } from '../domain/entities'
import type { LegalCaseOperationalSummary } from '../domain/entities'
import { CollaboratorProfile } from '#identity/domain/structures'
import type { ClientsRepository } from '#identity/interfaces/clients-repository'
import type { CaseCollaboratorsProvider, LegalCasesRepository } from '../interfaces'
import type { LegalAreasRepository } from '../../legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../../legal-catalog/interfaces/legal-topics-repository'
import type {
  AdminCasesQuery,
  LegalCaseOperationalRecordsQuery,
} from '../domain/structures'
import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { AppError } from '#shared/domain/errors/app-error'
import { PaginationResponse } from '#shared/responses/pagination-response'

type Request = {
  collaboratorProfile: CollaboratorProfile
  query: AdminCasesQuery
}

type PageMetadata = {
  clients: Map<string, Client>
  areas: Map<string, LegalArea>
  topics: Map<string, LegalTopic>
  managers: Map<string, CaseEligibleCollaborator>
}

export class ListAllLegalCasesForAdminUseCase
  implements UseCase<Request, PaginationResponse<LegalCaseOperationalSummary>>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute({ collaboratorProfile, query }: Request) {
    if (collaboratorProfile !== CollaboratorProfile.Admin) {
      throw new ForbiddenError('Apenas Administradores podem listar todos os Casos.')
    }

    const search = query.search?.trim() || undefined
    const matchingClientIds = search
      ? await this.clientsRepository.findIdsByName(search)
      : []
    const recordsQuery: LegalCaseOperationalRecordsQuery = {
      matchingClientIds,
      page: query.page,
      pageSize: query.pageSize,
      search,
    }
    const casesPage = await this.legalCasesRepository.listOperationalRecords(recordsQuery)
    const items = casesPage.items.length ? await this.projectPage(casesPage.items) : []

    return new PaginationResponse(
      items,
      casesPage.page,
      casesPage.pageSize,
      casesPage.total,
      casesPage.totalPages,
    )
  }

  private async projectPage(cases: readonly LegalCaseOperationalRecord[]) {
    const [clients, areas, topics, managers] = await Promise.all([
      this.clientsRepository.findByIds([
        ...new Set(cases.map(({ clientId }) => clientId)),
      ]),
      this.legalAreasRepository.findByIds([
        ...new Set(cases.map(({ legalAreaId }) => legalAreaId)),
      ]),
      this.legalTopicsRepository.findByIds([
        ...new Set(cases.map(({ legalTopicId }) => legalTopicId)),
      ]),
      this.collaboratorsProvider.findByIds([
        ...new Set(cases.flatMap(({ managerCollaboratorIds }) => managerCollaboratorIds)),
      ]),
    ])
    const metadata: PageMetadata = {
      clients: new Map(clients.map((client) => [client.id, client])),
      areas: new Map(areas.map((area) => [area.id, area])),
      topics: new Map(topics.map((topic) => [topic.id, topic])),
      managers: new Map(managers.map((manager) => [manager.collaboratorId, manager])),
    }
    return cases.map((legalCase) => this.projectSummary(legalCase, metadata))
  }

  private projectSummary(
    legalCase: LegalCaseOperationalRecord,
    metadata: PageMetadata,
  ): LegalCaseOperationalSummary {
    const client = metadata.clients.get(legalCase.clientId)
    const legalArea = metadata.areas.get(legalCase.legalAreaId)
    const legalTopic = metadata.topics.get(legalCase.legalTopicId)
    if (!client || !legalArea || !legalTopic) {
      throw new AppError('Os metadados operacionais do Caso não foram encontrados.')
    }

    return {
      id: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      clientName:
        client.type === 'natural' ? client.name : client.tradeName || client.legalName,
      legalArea: legalArea.name,
      legalTopic: legalTopic.name,
      status: legalCase.status,
      managerNames: legalCase.managerCollaboratorIds.flatMap((collaboratorId) => {
        const manager = metadata.managers.get(collaboratorId)
        return manager ? [manager.professionalName] : []
      }),
      updatedAt: legalCase.updatedAt,
    }
  }
}
