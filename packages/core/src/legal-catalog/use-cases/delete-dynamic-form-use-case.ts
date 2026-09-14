import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicFormAdministrationAuditEntry } from '../domain/entities/dynamic-form-administration-audit-entry'
import type { DeleteDynamicFormRequest } from '../domain/structures/delete-dynamic-form-request'
import type { DynamicFormAdministrationAuditRepository } from '../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { LegalCatalogDatabase } from '../interfaces/legal-catalog-database'

export class DeleteDynamicFormUseCase implements UseCase<DeleteDynamicFormRequest> {
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly dynamicFormAdministrationAuditRepository: DynamicFormAdministrationAuditRepository,
    private readonly legalCatalogDatabase: LegalCatalogDatabase,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  execute(request: DeleteDynamicFormRequest): Promise<void> {
    return this.legalCatalogDatabase.transaction(async () => {
      const form = await this.dynamicFormAdministrationRepository.findById(
        request.dynamicFormId,
      )
      if (!form) return

      const removed = await this.dynamicFormAdministrationRepository.remove(
        request.dynamicFormId,
      )
      if (!removed) return

      const auditEntry: DynamicFormAdministrationAuditEntry = {
        id: this.idProvider.generate(),
        dynamicFormId: form.id,
        actorCollaboratorId: request.actorCollaboratorId,
        action: 'deleted',
        occurredAt: this.datetimeProvider.now(),
        operationKey: null,
        details: {
          action: 'deleted',
          deletedFormName: form.name,
          previousStatus: form.status,
        },
      }
      await this.dynamicFormAdministrationAuditRepository.add(auditEntry)
    })
  }
}
