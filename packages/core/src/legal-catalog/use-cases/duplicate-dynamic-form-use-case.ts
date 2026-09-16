import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicForm } from '../domain/entities/dynamic-form'
import {
  DynamicFormNameConflictError,
  DynamicFormNotFoundError,
  IdempotencyKeyConflictError,
} from '../domain/errors'
import type { DuplicateDynamicFormRequest } from '../domain/structures/duplicate-dynamic-form-request'
import type { DynamicFormAdministrationAuditEntry } from '../domain/entities/dynamic-form-administration-audit-entry'
import type { DynamicFormOperation } from '../domain/structures/dynamic-form-operation'
import type { DynamicFormAdministrationAuditRepository } from '../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { DynamicFormOperationsRepository } from '../interfaces/dynamic-form-operations-repository'
import type { LegalCatalogDatabase } from '../interfaces/legal-catalog-database'

export class DuplicateDynamicFormUseCase
  implements UseCase<DuplicateDynamicFormRequest, DynamicForm>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly dynamicFormOperationsRepository: DynamicFormOperationsRepository,
    private readonly dynamicFormAdministrationAuditRepository: DynamicFormAdministrationAuditRepository,
    private readonly legalCatalogDatabase: LegalCatalogDatabase,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  execute(request: DuplicateDynamicFormRequest): Promise<DynamicForm> {
    return this.legalCatalogDatabase.transaction(async () => {
      const normalizedName = request.name.trim().toLocaleLowerCase('pt-BR')
      const previousOperation =
        await this.dynamicFormOperationsRepository.findByOperationKey(
          request.operationKey,
        )

      if (previousOperation) {
        this.assertReplayIdentity(previousOperation, request, normalizedName)
        return previousOperation.result
      }

      const source = await this.dynamicFormAdministrationRepository.findById(
        request.dynamicFormId,
      )
      if (!source) throw new DynamicFormNotFoundError(request.dynamicFormId)

      const conflictingForm =
        await this.dynamicFormAdministrationRepository.findByNormalizedName(
          normalizedName,
        )
      if (conflictingForm) throw new DynamicFormNameConflictError(conflictingForm.id)

      const now = this.datetimeProvider.now()
      const duplicatedForm: DynamicForm = {
        ...source,
        id: this.idProvider.generate(),
        name: request.name.trim(),
        normalizedName,
        status: 'unavailable',
        fields: source.fields.map((field, position) => ({
          ...field,
          id: this.idProvider.generate(),
          position,
          ...(field.options
            ? {
                options: field.options.map((option, optionPosition) => ({
                  ...option,
                  id: this.idProvider.generate(),
                  position: optionPosition,
                })),
              }
            : {}),
          ...(field.validation
            ? {
                validation: {
                  ...field.validation,
                  ...(field.validation.requiredWhen
                    ? { requiredWhen: { ...field.validation.requiredWhen } }
                    : {}),
                },
              }
            : {}),
        })),
        legalTopicIds: [...source.legalTopicIds],
        version: 1,
        createdAt: now,
        updatedAt: now,
      }

      const operation: DynamicFormOperation = {
        operationKey: request.operationKey,
        action: 'duplicated',
        actorCollaboratorId: request.actorCollaboratorId,
        targetDynamicFormId: duplicatedForm.id,
        expectedVersion: null,
        canonicalRequest: {
          kind: 'duplicated',
          sourceDynamicFormId: request.dynamicFormId,
          normalizedName,
        },
        result: duplicatedForm,
        completedAt: now,
      }
      const storedOperation =
        await this.dynamicFormOperationsRepository.addOrGet(operation)

      if (storedOperation.result.id !== duplicatedForm.id) {
        this.assertReplayIdentity(storedOperation, request, normalizedName)
        return storedOperation.result
      }

      await this.dynamicFormAdministrationRepository.add(duplicatedForm)

      const auditEntry: DynamicFormAdministrationAuditEntry = {
        id: this.idProvider.generate(),
        dynamicFormId: duplicatedForm.id,
        actorCollaboratorId: request.actorCollaboratorId,
        action: 'duplicated',
        occurredAt: now,
        operationKey: request.operationKey,
        details: {
          action: 'duplicated',
          sourceDynamicFormId: request.dynamicFormId,
          targetDynamicFormId: duplicatedForm.id,
          targetName: duplicatedForm.name,
        },
      }
      await this.dynamicFormAdministrationAuditRepository.add(auditEntry)

      return duplicatedForm
    })
  }

  private assertReplayIdentity(
    operation: DynamicFormOperation,
    request: DuplicateDynamicFormRequest,
    normalizedName: string,
  ): void {
    if (
      operation.action !== 'duplicated' ||
      operation.canonicalRequest.kind !== 'duplicated' ||
      operation.canonicalRequest.sourceDynamicFormId !== request.dynamicFormId ||
      operation.canonicalRequest.normalizedName !== normalizedName ||
      operation.actorCollaboratorId !== request.actorCollaboratorId
    ) {
      throw new IdempotencyKeyConflictError(
        request.operationKey,
        operation.action,
        operation.targetDynamicFormId,
      )
    }
  }
}
