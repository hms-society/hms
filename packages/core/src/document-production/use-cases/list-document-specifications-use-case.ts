import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type {
  DocumentSpecificationListItem,
  DocumentSpecificationListQuery,
  DocumentSpecificationListRecord,
} from '../domain/structures'
import type { DocumentSpecificationsRepository } from '../interfaces'

type Request = {
  readonly query?: DocumentSpecificationListQuery
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export class ListDocumentSpecificationsUseCase
  implements UseCase<Request, PaginationResponse<DocumentSpecificationListItem>>
{
  constructor(
    private readonly repository: DocumentSpecificationsRepository,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {}

  async execute({
    query = {},
  }: Request): Promise<PaginationResponse<DocumentSpecificationListItem>> {
    const page = await this.repository.list(this.normalizeQuery(query))
    const restrictedRecords = page.items.filter(
      (record) => record.application.scope === 'legal_context',
    )
    const resolvedExpertises = await this.resolveExpertises(restrictedRecords)

    return {
      ...page,
      items: page.items.map((record) =>
        this.toListItem(record, resolvedExpertises.get(record.documentSpecificationId)),
      ),
    }
  }

  private async resolveExpertises(
    records: readonly DocumentSpecificationListRecord[],
  ): Promise<Map<string, DocumentSpecificationListItem['application']>> {
    const applications = new Map<string, DocumentSpecificationListItem['application']>()

    await Promise.all(
      records.map(async (record) => {
        const application = record.application
        if (application.scope !== 'legal_context') return

        const selections = application.legalAreaIds.map((legalAreaId) => ({
          legalAreaId,
          legalTopicIds: application.legalTopicIdsByArea[legalAreaId] ?? [],
        }))
        const resolutions = await this.legalExpertiseCatalogProvider.resolve(selections)

        applications.set(record.documentSpecificationId, {
          scope: 'legal_context',
          moment: application.moment,
          legalExpertises: resolutions.map((resolution) => ({
            legalAreaId: resolution.legalArea.id,
            legalAreaName: resolution.legalArea.name,
            legalTopics: resolution.legalTopics.map((topic) => ({
              legalTopicId: topic.id,
              legalTopicName: topic.name,
            })),
          })),
        })
      }),
    )

    return applications
  }

  private toListItem(
    record: DocumentSpecificationListRecord,
    resolvedApplication?: DocumentSpecificationListItem['application'],
  ): DocumentSpecificationListItem {
    const application =
      record.application.scope === 'global'
        ? { scope: 'global' as const, moment: record.application.moment }
        : (resolvedApplication ?? {
            scope: 'legal_context' as const,
            moment: record.application.moment,
            legalExpertises: [],
          })

    return {
      documentSpecificationId: record.documentSpecificationId,
      name: record.name,
      description: record.description,
      application,
      status: record.status,
    }
  }

  private normalizeQuery(
    query: DocumentSpecificationListQuery,
  ): DocumentSpecificationListQuery {
    const search = this.normalizeText(query.search)

    return {
      ...(search ? { search } : {}),
      ...(this.normalizeText(query.legalAreaId)
        ? { legalAreaId: this.normalizeText(query.legalAreaId) }
        : {}),
      ...(this.normalizeText(query.legalTopicId)
        ? { legalTopicId: this.normalizeText(query.legalTopicId) }
        : {}),
      ...(query.moment ? { moment: query.moment } : {}),
      ...(query.status ? { status: query.status } : {}),
      page: this.normalizePage(query.page),
      pageSize: this.normalizePageSize(query.pageSize),
    }
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
    if (!Number.isFinite(pageSize) || !pageSize || pageSize < 1) return DEFAULT_PAGE_SIZE

    return Math.min(MAX_PAGE_SIZE, Math.floor(pageSize))
  }
}
