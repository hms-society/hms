import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider } from '../../../shared/interfaces'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { FormalizationStateConflictError } from '../../domain/errors'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers'
import { ReopenFormalizationDocumentPackageUseCase } from '../reopen-formalization-document-package-use-case'
import { makeFormalization, TEST_NOW } from './signature-configuration-test-helpers'

describe('Reopen Formalization Document Package Use Case', () => {
  it('reopens the package and clears confirmation fields with CAS', async () => {
    const formalization = makeFormalization()
    const repository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const confirmationTransaction = mock<FormalizationDocumentConfirmationTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    repository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(null)
    confirmationTransaction.reopen.mockResolvedValue({
      ...formalization,
      documentsConfirmedAt: undefined,
    })
    datetimeProvider.now.mockReturnValue(TEST_NOW)

    await expect(
      new ReopenFormalizationDocumentPackageUseCase(
        repository,
        requestsRepository,
        confirmationTransaction,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toMatchObject({ documentsConfirmedAt: undefined })
    expect(confirmationTransaction.reopen).toHaveBeenCalledWith({
      formalizationId: formalization.id,
      expectedVersion: formalization.version,
      occurredAt: TEST_NOW,
    })
  })

  it('blocks reopening while a signature request has been sent', async () => {
    const formalization = makeFormalization()
    const repository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const confirmationTransaction = mock<FormalizationDocumentConfirmationTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    repository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        formalizationId: formalization.id,
        status: 'sent',
      }),
    )

    await expect(
      new ReopenFormalizationDocumentPackageUseCase(
        repository,
        requestsRepository,
        confirmationTransaction,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).rejects.toBeInstanceOf(FormalizationStateConflictError)

    expect(confirmationTransaction.reopen).not.toHaveBeenCalled()
  })

  it('allows reopening after signature sending is cancelled', async () => {
    const formalization = makeFormalization()
    const repository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const confirmationTransaction = mock<FormalizationDocumentConfirmationTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    repository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        formalizationId: formalization.id,
        status: 'cancelled',
      }),
    )
    confirmationTransaction.reopen.mockResolvedValue({
      ...formalization,
      documentsConfirmedAt: undefined,
    })
    datetimeProvider.now.mockReturnValue(TEST_NOW)

    await expect(
      new ReopenFormalizationDocumentPackageUseCase(
        repository,
        requestsRepository,
        confirmationTransaction,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toMatchObject({ documentsConfirmedAt: undefined })
  })
})
