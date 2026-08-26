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

  it('keeps the revision when normalized answers only change array order', async () => {
    const base = fakeFormalization()
    const firstField = base.contractFormSnapshot.fields[0]
    const secondField = {
      id: 'second-field',
      key: 'second_field',
      label: 'Segundo campo',
      type: 'short_text' as const,
      position: 1,
      required: false,
    }
    const formalization = fakeFormalization({
      ...base,
      contractFormSnapshot: {
        ...base.contractFormSnapshot,
        fields: [firstField, secondField],
      },
      contractFormAnswers: [
        { fieldId: secondField.id, value: 'Segundo' },
        { fieldId: firstField.id, value: 'Rita' },
      ],
      contractFormRevision: 2,
      documentsConfirmedAt: new Date('2026-08-24T13:30:00.000Z'),
    })
    const now = new Date('2026-08-24T14:00:00.000Z')
    const closed = fakeFormalization({
      ...formalization,
      contractFormState: 'closed',
    })
    repository.findById.mockResolvedValue(formalization)
    repository.replace.mockResolvedValue(closed)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CloseFormalizationContractFormUseCase(repository, datetimeProvider).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
        answers: [
          { fieldId: firstField.id, value: 'Rita' },
          { fieldId: secondField.id, value: 'Segundo' },
        ],
      }),
    ).resolves.toBe(closed)

    const changes = repository.replace.mock.calls[0]?.[0].changes
    expect(changes).toEqual(expect.objectContaining({
      contractFormRevision: 2,
      contractFormState: 'closed',
    }))
    expect(changes).not.toHaveProperty('documentsConfirmedAt')
  })
})
