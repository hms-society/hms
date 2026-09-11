import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import {
  fakeFormalization,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { ReopenFormalizationContractFormUseCase } from '../reopen-formalization-contract-form-use-case'

describe('Reopen Formalization Contract Form Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>
  let requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
    requestsRepository = mock<FormalizationSignatureRequestsRepository>()
  })

  it('opens a closed active form without changing its revision', async () => {
    const formalization = fakeFormalization({
      contractFormState: 'closed',
      contractFormRevision: 1,
    })
    const reopened = fakeFormalization({
      ...formalization,
      contractFormState: 'open',
      version: 2,
    })
    repository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(null)
    repository.replace.mockResolvedValue(reopened)

    await expect(
      new ReopenFormalizationContractFormUseCase(repository, requestsRepository).execute({
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

  it('blocks reopening while signature sending is active', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed' })
    repository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        formalizationId: formalization.id,
        status: 'sent',
      }),
    )

    await expect(
      new ReopenFormalizationContractFormUseCase(repository, requestsRepository).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).rejects.toMatchObject({
      message: 'Cancele o envio de assinaturas antes de reabrir o formulário.',
    })

    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('allows reopening after signature sending is cancelled', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed' })
    const reopened = fakeFormalization({
      ...formalization,
      contractFormState: 'open',
      version: 2,
    })
    repository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        formalizationId: formalization.id,
        status: 'cancelled',
      }),
    )
    repository.replace.mockResolvedValue(reopened)

    await expect(
      new ReopenFormalizationContractFormUseCase(repository, requestsRepository).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(reopened)
  })
})
