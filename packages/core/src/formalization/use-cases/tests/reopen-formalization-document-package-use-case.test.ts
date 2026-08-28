import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider } from '../../../shared/interfaces'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationsRepository,
} from '../../interfaces'
import { ReopenFormalizationDocumentPackageUseCase } from '../reopen-formalization-document-package-use-case'
import { makeFormalization, TEST_NOW } from './signature-configuration-test-helpers'

describe('Reopen Formalization Document Package Use Case', () => {
  it('reopens the package and clears confirmation fields with CAS', async () => {
    const formalization = makeFormalization()
    const repository = mock<FormalizationsRepository>()
    const confirmationTransaction = mock<FormalizationDocumentConfirmationTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    repository.findById.mockResolvedValue(formalization)
    confirmationTransaction.reopen.mockResolvedValue({
      ...formalization,
      documentsConfirmedAt: undefined,
    })
    datetimeProvider.now.mockReturnValue(TEST_NOW)

    await expect(
      new ReopenFormalizationDocumentPackageUseCase(
        repository,
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
})
