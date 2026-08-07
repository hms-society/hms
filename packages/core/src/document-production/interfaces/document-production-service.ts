import type { RestResponse } from '#shared/responses/rest-response.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type {
  CreateDocumentSpecificationInput,
  DocumentSpecificationConfigurationUpdate,
  DocumentSpecificationDetails,
  DocumentSpecificationListItem,
  DocumentSpecificationListQuery,
  DocumentSpecificationTemplateUpdate,
} from '../domain/structures'

export interface DocumentProductionService {
  listDocumentSpecifications(
    query?: DocumentSpecificationListQuery,
  ): Promise<RestResponse<PaginationResponse<DocumentSpecificationListItem>>>
}

export interface DocumentProductionManagementService extends DocumentProductionService {
  createDocumentSpecification(
    request: CreateDocumentSpecificationInput,
  ): Promise<RestResponse<DocumentSpecificationDetails>>
  getDocumentSpecification(
    documentSpecificationId: string,
  ): Promise<RestResponse<DocumentSpecificationDetails>>
  updateDocumentSpecificationConfiguration(
    documentSpecificationId: string,
    request: DocumentSpecificationConfigurationUpdate,
  ): Promise<RestResponse<DocumentSpecificationDetails>>
  updateDocumentSpecificationTemplate(
    documentSpecificationId: string,
    request: DocumentSpecificationTemplateUpdate,
  ): Promise<RestResponse<DocumentSpecificationDetails>>
  deleteDocumentSpecification(
    documentSpecificationId: string,
  ): Promise<RestResponse<void>>
}
