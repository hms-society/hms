import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { FormalizationsRepository } from '../../interfaces'
import { CloseFormalizationContractFormUseCase } from '../close-formalization-contract-form-use-case'

describe('Close Formalization Contract Form Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
  })

  it('closes a complete form at revision one', async () => {
    const formalization = fakeFormalization()
    const now = new Date('2026-08-24T13:00:00.000Z')
    const closed = fakeFormalization({ ...formalization, contractFormState: 'closed', contractFormRevision: 1 })
    repository.findById.mockResolvedValue(formalization)
    repository.replace.mockResolvedValue(closed)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CloseFormalizationContractFormUseCase(repository, datetimeProvider).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
        answers: [{ fieldId: formalization.contractFormSnapshot.fields[0].id, value: 'Rita' }],
      }),
    ).resolves.toBe(closed)
    expect(repository.replace).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: formalization.version,
      changes: expect.objectContaining({ contractFormState: 'closed', contractFormRevision: 1, contractFormClosedAt: now }),
    }))
  })
})
