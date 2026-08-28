import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  Broker,
  DatetimeProvider,
  FileStorageProvider,
} from '../../../shared/interfaces'
import type { FormalizationSignatureConfigurationRepository } from '../../interfaces'
import { ReconcileFormalizationSignaturePreviewsUseCase } from '../reconcile-formalization-signature-previews-use-case'
import { TEST_NOW } from './signature-configuration-test-helpers'

describe('Reconcile Formalization Signature Previews Use Case', () => {
  it('reschedules pending work and cleans owned preview files', async () => {
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const storage = mock<FileStorageProvider>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    repository.listPendingPreviews.mockResolvedValue([
      {
        id: 'preview-id',
        formalizationId: 'formalization-id',
        documentId: 'document-id',
        documentVersionId: 'version-id',
        pages: [],
        state: 'pending',
        attemptsCount: 0,
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
      },
    ])
    repository.listExpiredPreviews.mockResolvedValue([])
    repository.listCleanupCandidates.mockResolvedValue([
      { previewId: 'stale-preview', fileId: 'stale-file' },
    ])
    repository.schedulePendingPreview.mockResolvedValue({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      leaseExpiresAt: TEST_NOW,
    })
    repository.markCleanupComplete.mockResolvedValue(true)

    await expect(
      new ReconcileFormalizationSignaturePreviewsUseCase(
        repository,
        storage,
        broker,
        datetimeProvider,
      ).execute({ limit: 100 }),
    ).resolves.toEqual({
      scheduledPreviewIds: ['preview-id'],
      cleanedPreviewIds: ['stale-preview'],
    })
    expect(storage.remove).toHaveBeenCalledWith('stale-file')
    expect(broker.publish).toHaveBeenCalledOnce()
  })

  it('reschedules expired processing work', async () => {
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const storage = mock<FileStorageProvider>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    repository.listPendingPreviews.mockResolvedValue([])
    repository.listExpiredPreviews.mockResolvedValue([
      {
        id: 'expired-preview-id',
        formalizationId: 'formalization-id',
        documentId: 'document-id',
        documentVersionId: 'version-id',
        pages: [],
        state: 'processing',
        attemptsCount: 3,
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
      },
    ])
    repository.listCleanupCandidates.mockResolvedValue([])
    repository.schedulePendingPreview.mockResolvedValue({
      previewId: 'expired-preview-id',
      attemptToken: 'retry-attempt-token',
      leaseExpiresAt: TEST_NOW,
    })

    await expect(
      new ReconcileFormalizationSignaturePreviewsUseCase(
        repository,
        storage,
        broker,
        datetimeProvider,
      ).execute({ limit: 100 }),
    ).resolves.toEqual({
      scheduledPreviewIds: ['expired-preview-id'],
      cleanedPreviewIds: [],
    })
    expect(broker.publish).toHaveBeenCalledOnce()
  })
})
