import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { FormalizationsRepository } from '../../interfaces'
import { SaveFormalizationContractFormDraftUseCase } from '../save-formalization-contract-form-draft-use-case'

describe('Save Formalization Contract Form Draft Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
  })

  it('persists normalized valid partial answers with the optimistic version', async () => {
    const formalization = fakeFormalization()
    const updated = fakeFormalization({
      ...formalization,
      version: 2,
      contractFormAnswers: [
        { fieldId: formalization.contractFormSnapshot.fields[0].id, value: 'Rita' },
      ],
    })
    repository.findById.mockResolvedValue(formalization)
    repository.replace.mockResolvedValue(updated)

    await expect(
      new SaveFormalizationContractFormDraftUseCase(repository).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
        answers: [
          { fieldId: formalization.contractFormSnapshot.fields[0].id, value: ' Rita ' },
        ],
      }),
    ).resolves.toBe(updated)
    expect(repository.replace).toHaveBeenCalledWith({
      formalizationId: formalization.id,
      expectedVersion: formalization.version,
      changes: {
        contractFormAnswers: [
          { fieldId: formalization.contractFormSnapshot.fields[0].id, value: 'Rita' },
        ],
      },
    })
  })
})
