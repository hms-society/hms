import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import type { DynamicFormAdministrationAuditRepository } from '../../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { LegalCatalogDatabase } from '../../interfaces/legal-catalog-database'
import { ChangeDynamicFormAvailabilityUseCase } from '../change-dynamic-form-availability-use-case'

const now = new Date('2026-09-11T12:00:00.000Z')
const form: DynamicForm = {
  id: 'form-id',
  name: 'Ficha',
  normalizedName: 'ficha',
  description: null,
  status: 'available',
  stage: 'consultation',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-id'],
  fields: [],
  version: 1,
  createdAt: now,
  updatedAt: now,
}

describe('Change Dynamic Form Availability Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let audit: MockProxy<DynamicFormAdministrationAuditRepository>
  let database: MockProxy<LegalCatalogDatabase>
  let idProvider: MockProxy<IdProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ChangeDynamicFormAvailabilityUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    audit = mock<DynamicFormAdministrationAuditRepository>()
    database = mock<LegalCatalogDatabase>()
    idProvider = mock<IdProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    database.transaction.mockImplementation(async (work) => work())
    datetimeProvider.now.mockReturnValue(now)
    idProvider.generate.mockReturnValue('audit-id')
    useCase = new ChangeDynamicFormAvailabilityUseCase(
      repository,
      audit,
      database,
      idProvider,
      datetimeProvider,
    )
  })

  it('changes the status and audits an effective transition', async () => {
    const updated = { ...form, status: 'unavailable' as const, updatedAt: now }
    repository.findById.mockResolvedValue(form)
    repository.changeStatus.mockResolvedValue(updated)

    await expect(
      useCase.execute({
        dynamicFormId: 'form-id',
        status: 'unavailable',
        actorCollaboratorId: 'actor-id',
      }),
    ).resolves.toBe(updated)
    expect(repository.changeStatus).toHaveBeenCalledWith({
      id: 'form-id',
      status: 'unavailable',
      updatedAt: now,
    })
    expect(audit.add).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'availability_changed',
        details: expect.objectContaining({ previousStatus: 'available' }),
      }),
    )
  })

  it('makes an already requested status a successful no-op', async () => {
    repository.findById.mockResolvedValue(form)

    await expect(
      useCase.execute({
        dynamicFormId: 'form-id',
        status: 'available',
        actorCollaboratorId: 'actor-id',
      }),
    ).resolves.toBe(form)
    expect(repository.changeStatus).not.toHaveBeenCalled()
    expect(audit.add).not.toHaveBeenCalled()
  })

  it('returns the current form without auditing when another request wins the update race', async () => {
    const updated = { ...form, status: 'unavailable' as const, updatedAt: now }
    repository.findById.mockResolvedValueOnce(form).mockResolvedValueOnce(updated)
    repository.changeStatus.mockResolvedValue(null)

    await expect(
      useCase.execute({
        dynamicFormId: 'form-id',
        status: 'unavailable',
        actorCollaboratorId: 'actor-id',
      }),
    ).resolves.toBe(updated)
    expect(audit.add).not.toHaveBeenCalled()
  })
})
