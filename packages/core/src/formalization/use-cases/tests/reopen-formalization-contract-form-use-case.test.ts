import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { FormalizationsRepository } from '../../interfaces'
import { ReopenFormalizationContractFormUseCase } from '../reopen-formalization-contract-form-use-case'

describe('Reopen Formalization Contract Form Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
  })

  it('opens a closed active form without changing its revision', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed', contractFormRevision: 1 })
    const reopened = fakeFormalization({ ...formalization, contractFormState: 'open', version: 2 })
    repository.findById.mockResolvedValue(formalization)
    repository.replace.mockResolvedValue(reopened)

    await expect(
      new ReopenFormalizationContractFormUseCase(repository).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(reopened)
    expect(repository.replace).toHaveBeenCalledWith({
      formalizationId: formalization.id,
      expectedVersion: formalization.version,
      changes: { contractFormState: 'open' },
    })
  })
})
