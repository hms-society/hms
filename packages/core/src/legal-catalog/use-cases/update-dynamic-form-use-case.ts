import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicForm } from '../domain/entities/dynamic-form'
import type { DynamicFormDefinitionField } from '../domain/entities/dynamic-form-definition-field'
import {
  DynamicFormDefinitionValidationError,
  DynamicFormNameConflictError,
  DynamicFormNotFoundError,
  DynamicFormVersionConflictError,
  IdempotencyKeyConflictError,
} from '../domain/errors'
import type { UpdateDynamicFormRequest } from '../domain/structures/update-dynamic-form-request'
import type { DynamicFormDefinitionDraft } from '../domain/structures/dynamic-form-definition-draft'
import type { DynamicFormOperation } from '../domain/structures/dynamic-form-operation'
import type { DynamicFormValidationIssue } from '#shared/domain/structures/dynamic-form-validation-issue'
import type { DynamicFormAdministrationAuditRepository } from '../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { DynamicFormOperationsRepository } from '../interfaces/dynamic-form-operations-repository'
import type { LegalAreasRepository } from '../interfaces/legal-areas-repository'
import type { LegalCatalogDatabase } from '../interfaces/legal-catalog-database'
import type { LegalTopicsRepository } from '../interfaces/legal-topics-repository'
import type { ValidateDynamicFormDefinitionUseCase } from './validate-dynamic-form-definition-use-case'

export class UpdateDynamicFormUseCase
  implements UseCase<UpdateDynamicFormRequest, DynamicForm>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly dynamicFormOperationsRepository: DynamicFormOperationsRepository,
    private readonly dynamicFormAdministrationAuditRepository: DynamicFormAdministrationAuditRepository,
    private readonly legalCatalogDatabase: LegalCatalogDatabase,
    private readonly validateDynamicFormDefinitionUseCase: ValidateDynamicFormDefinitionUseCase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {}

  execute(request: UpdateDynamicFormRequest): Promise<DynamicForm> {
    return this.legalCatalogDatabase.transaction(async () => {
      const canonicalRequest = this.canonicalizeDraft(request)
      const previousOperation =
        await this.dynamicFormOperationsRepository.findByOperationKey(
          request.operationKey,
        )
      if (previousOperation) {
        this.assertReplayIdentity(previousOperation, request, canonicalRequest)
        return previousOperation.result
      }

      const currentForm = await this.dynamicFormAdministrationRepository.findById(
        request.dynamicFormId,
      )
      if (!currentForm) throw new DynamicFormNotFoundError(request.dynamicFormId)

      await this.validateClassification(request, currentForm)
      const fields = await this.validateDynamicFormDefinitionUseCase.execute({
        draft: request,
        existingForm: currentForm,
      })
      const normalizedName = request.name.trim().toLocaleLowerCase('pt-BR')
      const conflictingForm =
        await this.dynamicFormAdministrationRepository.findByNormalizedName(
          normalizedName,
        )
      if (conflictingForm && conflictingForm.id !== currentForm.id) {
        throw new DynamicFormNameConflictError(conflictingForm.id)
      }

      const replacement = await this.dynamicFormAdministrationRepository.replace(
        request.dynamicFormId,
        {
          name: request.name.trim(),
          normalizedName,
          description: request.description?.trim() || null,
          stage: request.stage,
          legalAreaId: request.legalAreaId,
          legalTopicIds: [...request.legalTopicIds],
          fields,
          updatedAt: this.datetimeProvider.now(),
        },
        request.expectedVersion,
      )
      if (replacement.kind === 'not_found') {
        throw new DynamicFormNotFoundError(request.dynamicFormId)
      }
      if (replacement.kind === 'version_conflict') {
        const concurrentOperation =
          await this.dynamicFormOperationsRepository.findByOperationKey(
            request.operationKey,
          )
        if (concurrentOperation) {
          this.assertReplayIdentity(concurrentOperation, request, canonicalRequest)
          return concurrentOperation.result
        }
        throw new DynamicFormVersionConflictError(
          request.dynamicFormId,
          request.expectedVersion,
          replacement.currentVersion,
        )
      }

      const operation: DynamicFormOperation = {
        operationKey: request.operationKey,
        action: 'updated',
        actorCollaboratorId: request.actorCollaboratorId,
        targetDynamicFormId: request.dynamicFormId,
        expectedVersion: request.expectedVersion,
        canonicalRequest: { kind: 'updated', definition: canonicalRequest },
        result: replacement.form,
        completedAt: replacement.form.updatedAt,
      }
      const storedOperation =
        await this.dynamicFormOperationsRepository.addOrGet(operation)
      if (
        storedOperation.result.version !== replacement.form.version ||
        storedOperation.result.id !== replacement.form.id
      ) {
        this.assertReplayIdentity(storedOperation, request, canonicalRequest)
        return storedOperation.result
      }

      if (replacement.kind === 'updated') {
        await this.dynamicFormAdministrationAuditRepository.add({
          id: this.idProvider.generate(),
          dynamicFormId: replacement.form.id,
          actorCollaboratorId: request.actorCollaboratorId,
          action: 'updated',
          occurredAt: replacement.form.updatedAt,
          operationKey: request.operationKey,
          details: this.createUpdateAuditDetails(currentForm, replacement.form),
        })
      }

      return replacement.form
    })
  }

  private async validateClassification(
    request: UpdateDynamicFormRequest,
    currentForm: DynamicForm,
  ): Promise<void> {
    const [areas, topics] = await Promise.all([
      this.legalAreasRepository.findByIds([request.legalAreaId]),
      this.legalTopicsRepository.findByIds(request.legalTopicIds),
    ])
    const issues: DynamicFormValidationIssue[] = []
    const area = areas.find((item) => item.id === request.legalAreaId)
    const isRetainedArea = currentForm.legalAreaId === request.legalAreaId
    if (!area || (!area.active && !isRetainedArea)) {
      issues.push({
        path: 'legalAreaId',
        message: 'A área jurídica nova precisa estar ativa.',
      })
    }
    const retainedTopics = new Set(currentForm.legalTopicIds)
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]))
    for (const [index, topicId] of request.legalTopicIds.entries()) {
      const topic = topicsById.get(topicId)
      if (!topic) {
        issues.push({
          path: `legalTopicIds.${index}`,
          message: 'O assunto jurídico não foi encontrado.',
        })
      } else if (
        topic.legalAreaId !== request.legalAreaId ||
        (!topic.active && !retainedTopics.has(topicId))
      ) {
        issues.push({
          path: `legalTopicIds.${index}`,
          message:
            'Os assuntos novos precisam estar ativos e pertencer à área selecionada.',
        })
      }
    }
    if (issues.length > 0) throw new DynamicFormDefinitionValidationError(issues)
  }

  private canonicalizeDraft(
    request: UpdateDynamicFormRequest,
  ): DynamicFormDefinitionDraft {
    return {
      name: request.name.trim(),
      ...(request.description?.trim() ? { description: request.description.trim() } : {}),
      stage: request.stage,
      legalAreaId: request.legalAreaId,
      legalTopicIds: [...request.legalTopicIds],
      fields: request.fields.map((field) => ({
        ...field,
        label: field.label.trim(),
        ...(field.description?.trim() ? { description: field.description.trim() } : {}),
        ...('placeholder' in field && field.placeholder?.trim()
          ? { placeholder: field.placeholder.trim() }
          : {}),
        ...('options' in field
          ? {
              options: field.options.map((option) => ({
                ...option,
                label: option.label.trim(),
              })),
            }
          : {}),
      })),
    }
  }

  private assertReplayIdentity(
    operation: DynamicFormOperation,
    request: UpdateDynamicFormRequest,
    canonicalRequest: DynamicFormDefinitionDraft,
  ): void {
    const isSameRequest =
      operation.action === 'updated' &&
      operation.actorCollaboratorId === request.actorCollaboratorId &&
      operation.targetDynamicFormId === request.dynamicFormId &&
      operation.expectedVersion === request.expectedVersion &&
      operation.canonicalRequest.kind === 'updated' &&
      JSON.stringify(operation.canonicalRequest.definition) ===
        JSON.stringify(canonicalRequest)
    if (!isSameRequest) {
      throw new IdempotencyKeyConflictError(
        request.operationKey,
        operation.action,
        operation.targetDynamicFormId,
      )
    }
  }

  private createUpdateAuditDetails(previousForm: DynamicForm, nextForm: DynamicForm) {
    const previousFields = new Map(previousForm.fields.map((field) => [field.id, field]))
    const nextFields = new Map(nextForm.fields.map((field) => [field.id, field]))
    const addedFieldIds = nextForm.fields
      .filter((field) => !previousFields.has(field.id))
      .map((field) => field.id)
    const removedFieldIds = previousForm.fields
      .filter((field) => !nextFields.has(field.id))
      .map((field) => field.id)
    const changedFieldIds = nextForm.fields
      .filter((field) => {
        const previousField = previousFields.get(field.id)
        if (!previousField) return false
        return (
          JSON.stringify(this.withoutPosition(previousField)) !==
          JSON.stringify(this.withoutPosition(field))
        )
      })
      .map((field) => field.id)
    const reorderedFieldIds = nextForm.fields
      .filter((field) => previousFields.get(field.id)?.position !== field.position)
      .map((field) => field.id)

    return {
      action: 'updated' as const,
      previousVersion: previousForm.version,
      nextVersion: nextForm.version,
      addedFieldIds,
      changedFieldIds,
      removedFieldIds,
      reorderedFieldIds,
    }
  }

  private withoutPosition(field: DynamicFormDefinitionField) {
    const { position: _position, ...withoutPosition } = field
    return withoutPosition
  }
}
