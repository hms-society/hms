import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicForm } from '../domain/entities/dynamic-form'
import {
  DynamicFormNameConflictError,
  DynamicFormNotFoundError,
  IdempotencyKeyConflictError,
} from '../domain/errors'
import type { DuplicateDynamicFormOperation } from '../domain/structures/duplicate-dynamic-form-operation'
import type { DuplicateDynamicFormRequest } from '../domain/structures/duplicate-dynamic-form-request'
import type { DynamicFormAdministrationAuditEntry } from '../domain/entities/dynamic-form-administration-audit-entry'
import type { DynamicFormAdministrationAuditRepository } from '../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { DynamicFormDuplicateOperationsRepository } from '../interfaces/dynamic-form-duplicate-operations-repository'
import type { LegalCatalogDatabase } from '../interfaces/legal-catalog-database'

export class DuplicateDynamicFormUseCase
  implements UseCase<DuplicateDynamicFormRequest, DynamicForm>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly dynamicFormDuplicateOperationsRepository: DynamicFormDuplicateOperationsRepository,
    private readonly dynamicFormAdministrationAuditRepository: DynamicFormAdministrationAuditRepository,
    private readonly legalCatalogDatabase: LegalCatalogDatabase,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  execute(request: DuplicateDynamicFormRequest): Promise<DynamicForm> {
    return this.legalCatalogDatabase.transaction(async () => {
      const normalizedName = request.name.trim().toLocaleLowerCase('pt-BR')
      const previousOperation =
        await this.dynamicFormDuplicateOperationsRepository.findByOperationKey(
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
        fields: source.fields.map((field) => ({
          ...field,
          ...(field.options
            ? { options: field.options.map((option) => ({ ...option })) }
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
        createdAt: now,
        updatedAt: now,
      }

      const operation: DuplicateDynamicFormOperation = {
        operationKey: request.operationKey,
        sourceDynamicFormId: request.dynamicFormId,
        requestedNormalizedName: normalizedName,
        actorCollaboratorId: request.actorCollaboratorId,
        result: duplicatedForm,
        completedAt: now,
      }
      const storedOperation =
        await this.dynamicFormDuplicateOperationsRepository.addOrGet(operation)

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
    operation: DuplicateDynamicFormOperation,
    request: DuplicateDynamicFormRequest,
    normalizedName: string,
  ): void {
    if (
      operation.sourceDynamicFormId !== request.dynamicFormId ||
      operation.requestedNormalizedName !== normalizedName ||
      operation.actorCollaboratorId !== request.actorCollaboratorId
    ) {
      throw new IdempotencyKeyConflictError(
        request.operationKey,
        operation.sourceDynamicFormId,
      )
    }
  }
}
