import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import type { DynamicFormAdministrationAuditRepository } from '../../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { LegalCatalogDatabase } from '../../interfaces/legal-catalog-database'
import { DeleteDynamicFormUseCase } from '../delete-dynamic-form-use-case'

const form: DynamicForm = {
  id: 'form-id',
  name: 'Ficha',
  normalizedName: 'ficha',
  description: null,
  status: 'unavailable',
  stage: 'formalization',
  legalAreaId: 'area-id',
  legalTopicIds: [],
  fields: [],
  version: 1,
  createdAt: new Date('2026-09-01T12:00:00.000Z'),
  updatedAt: new Date('2026-09-01T12:00:00.000Z'),
}

describe('Delete Dynamic Form Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let audit: MockProxy<DynamicFormAdministrationAuditRepository>
  let database: MockProxy<LegalCatalogDatabase>
  let idProvider: MockProxy<IdProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: DeleteDynamicFormUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    audit = mock<DynamicFormAdministrationAuditRepository>()
    database = mock<LegalCatalogDatabase>()
    idProvider = mock<IdProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    database.transaction.mockImplementation(async (work) => work())
    idProvider.generate.mockReturnValue('audit-id')
    datetimeProvider.now.mockReturnValue(new Date('2026-09-11T12:00:00.000Z'))
    useCase = new DeleteDynamicFormUseCase(
      repository,
      audit,
      database,
      idProvider,
      datetimeProvider,
    )
  })

  it('removes the definition and writes one safe audit entry', async () => {
    repository.findById.mockResolvedValue(form)
    repository.remove.mockResolvedValue(true)

    await expect(
      useCase.execute({ dynamicFormId: 'form-id', actorCollaboratorId: 'actor-id' }),
    ).resolves.toBeUndefined()
    expect(repository.remove).toHaveBeenCalledWith('form-id')
    expect(audit.add).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'deleted',
        dynamicFormId: 'form-id',
        details: expect.objectContaining({ deletedFormName: 'Ficha' }),
      }),
    )
  })

  it('treats a missing definition as an idempotent replay', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ dynamicFormId: 'form-id', actorCollaboratorId: 'actor-id' }),
    ).resolves.toBeUndefined()
    expect(repository.remove).not.toHaveBeenCalled()
    expect(audit.add).not.toHaveBeenCalled()
  })
})
