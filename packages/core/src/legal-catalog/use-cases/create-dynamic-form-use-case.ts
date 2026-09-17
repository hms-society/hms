import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicForm } from '../domain/entities/dynamic-form'
import {
  DynamicFormDefinitionValidationError,
  DynamicFormNameConflictError,
  IdempotencyKeyConflictError,
} from '../domain/errors'
import type { DynamicFormAdministrationAuditEntry } from '../domain/entities/dynamic-form-administration-audit-entry'
import type { CreateDynamicFormRequest } from '../domain/structures/create-dynamic-form-request'
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

export class CreateDynamicFormUseCase
  implements UseCase<CreateDynamicFormRequest, DynamicForm>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly dynamicFormOperationsRepository: DynamicFormOperationsRepository,
    private readonly dynamicFormAdministrationAuditRepository: DynamicFormAdministrationAuditRepository,
    private readonly legalCatalogDatabase: LegalCatalogDatabase,
    private readonly validateDynamicFormDefinitionUseCase: ValidateDynamicFormDefinitionUseCase,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  execute(request: CreateDynamicFormRequest): Promise<DynamicForm> {
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

      await this.validateClassification(request)
      const fields = await this.validateDynamicFormDefinitionUseCase.execute({
        draft: request,
      })
      const normalizedName = request.name.trim().toLocaleLowerCase('pt-BR')
      const conflictingForm =
        await this.dynamicFormAdministrationRepository.findByNormalizedName(
          normalizedName,
        )
      if (conflictingForm) throw new DynamicFormNameConflictError(conflictingForm.id)

      const now = this.datetimeProvider.now()
      const form: DynamicForm = {
        id: this.idProvider.generate(),
        name: request.name.trim(),
        normalizedName,
        description: request.description?.trim() || null,
        status: 'unavailable',
        stage: request.stage,
        legalAreaId: request.legalAreaId,
        legalTopicIds: [...request.legalTopicIds],
        fields,
        version: 1,
        createdAt: now,
        updatedAt: now,
      }
      const operation: DynamicFormOperation = {
        operationKey: request.operationKey,
        action: 'created',
        actorCollaboratorId: request.actorCollaboratorId,
        targetDynamicFormId: form.id,
        expectedVersion: null,
        canonicalRequest: { kind: 'created', definition: canonicalRequest },
        result: form,
        completedAt: now,
      }
      const storedOperation =
        await this.dynamicFormOperationsRepository.addOrGet(operation)
      if (storedOperation.result.id !== form.id) {
        this.assertReplayIdentity(storedOperation, request, canonicalRequest)
        return storedOperation.result
      }

      await this.dynamicFormAdministrationRepository.add(form)
      const auditEntry: DynamicFormAdministrationAuditEntry = {
        id: this.idProvider.generate(),
        dynamicFormId: form.id,
        actorCollaboratorId: request.actorCollaboratorId,
        action: 'created',
        occurredAt: now,
        operationKey: request.operationKey,
        details: {
          action: 'created',
          version: 1,
          formName: form.name,
          fieldIds: fields.map((field) => field.id),
        },
      }
      await this.dynamicFormAdministrationAuditRepository.add(auditEntry)

      return form
    })
  }

  private async validateClassification(request: CreateDynamicFormRequest): Promise<void> {
    const [areas, topics] = await Promise.all([
      this.legalAreasRepository.findByIds([request.legalAreaId]),
      this.legalTopicsRepository.findByIds(request.legalTopicIds),
    ])
    const issues: DynamicFormValidationIssue[] = []
    const area = areas.find((item) => item.id === request.legalAreaId)
    if (!area?.active) {
      issues.push({
        path: 'legalAreaId',
        message: 'A área jurídica precisa estar ativa.',
      })
    }
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]))
    for (const [index, topicId] of request.legalTopicIds.entries()) {
      const topic = topicsById.get(topicId)
      if (!topic) {
        issues.push({
          path: `legalTopicIds.${index}`,
          message: 'O assunto jurídico não foi encontrado.',
        })
      } else if (!topic.active || topic.legalAreaId !== request.legalAreaId) {
        issues.push({
          path: `legalTopicIds.${index}`,
          message: 'Os assuntos precisam ser ativos e pertencer à área selecionada.',
        })
      }
    }
    if (issues.length > 0) throw new DynamicFormDefinitionValidationError(issues)
  }

  private canonicalizeDraft(
    request: CreateDynamicFormRequest,
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
    request: CreateDynamicFormRequest,
    canonicalRequest: DynamicFormDefinitionDraft,
  ): void {
    const isSameRequest =
      operation.action === 'created' &&
      operation.actorCollaboratorId === request.actorCollaboratorId &&
      operation.expectedVersion === null &&
      operation.canonicalRequest.kind === 'created' &&
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
}
