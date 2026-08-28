import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { Broker, DatetimeProvider } from '../../../shared/interfaces'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { InitializeFormalizationSignatureConfigurationUseCase } from '../initialize-formalization-signature-configuration-use-case'
import {
  makeConfiguration,
  makeFormalization,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Initialize Formalization Signature Configuration Use Case', () => {
  it('initializes a confirmed legacy configuration and publishes the batch', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const transaction = mock<FormalizationDocumentConfirmationTransaction>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    transaction.initializeConfirmed.mockResolvedValue({
      formalization,
      pendingPreviewIds: ['preview-id'],
    })
    repository.schedulePendingPreview.mockResolvedValue({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      leaseExpiresAt: new Date(TEST_NOW.getTime() + 1000),
    })
    repository.findByFormalizationId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(configuration)

    await expect(
      new InitializeFormalizationSignatureConfigurationUseCase(
        formalizationsRepository,
        transaction,
        repository,
        broker,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(configuration)
    expect(broker.publish).toHaveBeenCalledOnce()
  })

  it('returns an existing configuration without creating another batch', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const transaction = mock<FormalizationDocumentConfirmationTransaction>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const broker = mock<Broker>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)

    await expect(
      new InitializeFormalizationSignatureConfigurationUseCase(
        formalizationsRepository,
        transaction,
        repository,
        broker,
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(configuration)
    expect(transaction.initializeConfirmed).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('repairs an existing empty configuration', async () => {
    const formalization = makeFormalization()
    const existingConfiguration = makeConfiguration({
      formalizationId: formalization.id,
      documents: [],
      previewPreparation: { total: 0, pending: 0, processing: 0, ready: 0, failed: 0 },
    })
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const transaction = mock<FormalizationDocumentConfirmationTransaction>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    transaction.initializeConfirmed.mockResolvedValue({
      formalization,
      pendingPreviewIds: ['preview-id'],
    })
    repository.schedulePendingPreview.mockResolvedValue({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      leaseExpiresAt: new Date(TEST_NOW.getTime() + 1000),
    })
    repository.findByFormalizationId
      .mockResolvedValueOnce(existingConfiguration)
      .mockResolvedValueOnce(configuration)

    await expect(
      new InitializeFormalizationSignatureConfigurationUseCase(
        formalizationsRepository,
        transaction,
        repository,
        broker,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(configuration)
    expect(transaction.initializeConfirmed).toHaveBeenCalledOnce()
    expect(broker.publish).toHaveBeenCalledOnce()
  })
})
