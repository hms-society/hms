import type { RestResponse } from '#shared/responses/rest-response.ts'

import type { LegalArea, LegalTopic } from '../domain/entities'
import type { DynamicForm } from '../domain/entities/dynamic-form'
import type { DynamicFormListQuery } from '../domain/structures/dynamic-form-list-query'
import type { DynamicFormListResult } from '../domain/structures/dynamic-form-list-result'
import type { CreateDynamicFormRequest } from '../domain/structures/create-dynamic-form-request'
import type { DynamicFormEditorDetails } from '../domain/structures/dynamic-form-editor-details'
import type { DynamicFormStatus } from '../domain/structures/dynamic-form-status'
import type { UpdateDynamicFormRequest } from '../domain/structures/update-dynamic-form-request'
import type { DynamicFormUsageImpact } from '../domain/structures/dynamic-form-usage-impact'
import type { FindDynamicFormNameConflictResult } from '../domain/structures/find-dynamic-form-name-conflict-result'

export interface LegalCatalogService {
  listLegalAreas(): Promise<RestResponse<LegalArea[]>>
  listLegalTopics(legalAreaId: string): Promise<RestResponse<LegalTopic[]>>
  listDynamicFormsForAdministration(
    query: DynamicFormListQuery,
  ): Promise<RestResponse<DynamicFormListResult>>
  findDynamicFormNameConflict(
    name: string,
  ): Promise<RestResponse<FindDynamicFormNameConflictResult>>
  duplicateDynamicForm(
    dynamicFormId: string,
    input: { name: string; operationKey: string },
  ): Promise<RestResponse<DynamicForm>>
  getDynamicFormUsageImpact(
    dynamicFormId: string,
  ): Promise<RestResponse<DynamicFormUsageImpact>>
  changeDynamicFormAvailability(
    dynamicFormId: string,
    input: { status: DynamicFormStatus },
  ): Promise<RestResponse<DynamicForm>>
  deleteDynamicForm(dynamicFormId: string): Promise<RestResponse<void>>
  getDynamicFormForAdministration(
    dynamicFormId: string,
  ): Promise<RestResponse<DynamicFormEditorDetails>>
  createDynamicForm(
    input: Omit<CreateDynamicFormRequest, 'actorCollaboratorId'>,
  ): Promise<RestResponse<DynamicForm>>
  updateDynamicForm(
    dynamicFormId: string,
    input: Omit<UpdateDynamicFormRequest, 'dynamicFormId' | 'actorCollaboratorId'>,
  ): Promise<RestResponse<DynamicForm>>
  getDynamicFormFieldUsageImpact(
    dynamicFormId: string,
    fieldId: string,
  ): Promise<RestResponse<DynamicFormUsageImpact>>
}
