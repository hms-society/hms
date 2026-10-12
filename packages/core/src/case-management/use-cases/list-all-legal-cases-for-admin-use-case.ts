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
    const items = await Promise.all(
      casesPage.items.map((legalCase) => this.projectSummary(legalCase)),
    )

    return new PaginationResponse(
      items,
      casesPage.page,
      casesPage.pageSize,
      casesPage.total,
      casesPage.totalPages,
    )
  }

  private async projectSummary(
    legalCase: LegalCaseOperationalRecord,
  ): Promise<LegalCaseOperationalSummary> {
    const [client, legalArea, legalTopic] = await Promise.all([
      this.clientsRepository.findById(legalCase.clientId),
      this.legalAreasRepository.findById(legalCase.legalAreaId),
      this.legalTopicsRepository.findById(legalCase.legalTopicId),
    ])
    if (!client || !legalArea || !legalTopic) {
      throw new AppError('Os metadados operacionais do Caso não foram encontrados.')
    }

    const managers = await Promise.all(
      legalCase.managerCollaboratorIds.map((collaboratorId) =>
        this.collaboratorsProvider.findById(collaboratorId),
      ),
    )

    return {
      id: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      clientName:
        client.type === 'natural' ? client.name : client.tradeName || client.legalName,
      legalArea: legalArea.name,
      legalTopic: legalTopic.name,
      status: legalCase.status,
      managerNames: managers.flatMap((manager) =>
        manager ? [manager.professionalName] : [],
      ),
      updatedAt: legalCase.updatedAt,
    }
  }
}
