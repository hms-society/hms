import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type {
  DocumentSpecification,
  DocumentSpecificationCreation,
} from '../domain/entities'
import type {
  DocumentSpecificationConfigurationUpdate,
  DocumentSpecificationTemplateUpdate,
  DocumentSpecificationListQuery,
  DocumentSpecificationListRecord,
} from '../domain/structures'

export interface DocumentSpecificationsRepository {
  list(
    query: DocumentSpecificationListQuery,
  ): Promise<PaginationResponse<DocumentSpecificationListRecord>>
  add(specification: DocumentSpecificationCreation): Promise<DocumentSpecification>
  findById(documentSpecificationId: string): Promise<DocumentSpecification | undefined>
  replaceConfiguration(
    documentSpecificationId: string,
    changes: DocumentSpecificationConfigurationUpdate,
  ): Promise<DocumentSpecification | undefined>
  replaceTemplate(
    documentSpecificationId: string,
    changes: DocumentSpecificationTemplateUpdate,
  ): Promise<DocumentSpecification | undefined>
  remove(documentSpecificationId: string): Promise<boolean>
  addMany(
    specifications: readonly DocumentSpecificationCreation[],
  ): Promise<readonly DocumentSpecification[]>
  removeAll(): Promise<void>
  registerAuditLog(data: {
    documentSpecificationId: string
    userId: string
    action: string
    previousValue: string
    newValue: string
  }): Promise<void>
}