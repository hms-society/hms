import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicForm } from '../domain/entities/dynamic-form'
import type { DynamicFormAdministrationAuditEntry } from '../domain/entities/dynamic-form-administration-audit-entry'
import { DynamicFormNotFoundError } from '../domain/errors/dynamic-form-not-found-error'
import type { ChangeDynamicFormAvailabilityRequest } from '../domain/structures/change-dynamic-form-availability-request'
import type { DynamicFormAdministrationAuditRepository } from '../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { LegalCatalogDatabase } from '../interfaces/legal-catalog-database'

export class ChangeDynamicFormAvailabilityUseCase
  implements UseCase<ChangeDynamicFormAvailabilityRequest, DynamicForm>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly dynamicFormAdministrationAuditRepository: DynamicFormAdministrationAuditRepository,
    private readonly legalCatalogDatabase: LegalCatalogDatabase,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  execute(request: ChangeDynamicFormAvailabilityRequest): Promise<DynamicForm> {
    return this.legalCatalogDatabase.transaction(async () => {
      const form = await this.dynamicFormAdministrationRepository.findById(
        request.dynamicFormId,
      )
      if (!form) throw new DynamicFormNotFoundError(request.dynamicFormId)
      if (form.status === request.status) return form

      const updatedAt = this.datetimeProvider.now()
      const updatedForm = await this.dynamicFormAdministrationRepository.changeStatus({
        id: request.dynamicFormId,
        status: request.status,
        updatedAt,
      })
      if (!updatedForm) {
        const currentForm = await this.dynamicFormAdministrationRepository.findById(
          request.dynamicFormId,
        )
        if (!currentForm) throw new DynamicFormNotFoundError(request.dynamicFormId)
        return currentForm
      }

      const auditEntry: DynamicFormAdministrationAuditEntry = {
        id: this.idProvider.generate(),
        dynamicFormId: updatedForm.id,
        actorCollaboratorId: request.actorCollaboratorId,
        action: 'availability_changed',
        occurredAt: updatedAt,
        operationKey: null,
        details: {
          action: 'availability_changed',
          previousStatus: form.status,
          targetStatus: request.status,
          formName: form.name,
        },
      }
      await this.dynamicFormAdministrationAuditRepository.add(auditEntry)

      return updatedForm
    })
  }
}
