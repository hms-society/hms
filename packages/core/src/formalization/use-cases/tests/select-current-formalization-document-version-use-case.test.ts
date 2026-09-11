import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import {
  DocumentPackageFaker,
  DocumentVersionFaker,
  PackageDocumentFaker,
} from '../../../document-production/domain/entities/fakers'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { Broker, DatetimeProvider } from '../../../shared/interfaces'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { SelectCurrentFormalizationDocumentVersionUseCase } from '../select-current-formalization-document-version-use-case'

function buildUseCase(
  formalizationsRepository: FormalizationsRepository,
  confirmationTransaction = mock<FormalizationDocumentConfirmationTransaction>(),
  configurationRepository = mock<FormalizationSignatureConfigurationRepository>(),
  broker = mock<Broker>(),
  datetimeProvider = mock<DatetimeProvider>(),
) {
  return new SelectCurrentFormalizationDocumentVersionUseCase(
    formalizationsRepository,
    mock<DocumentPackagesRepository>(),
    mock<PackageDocumentsRepository>(),
    mock<DocumentsRepository>(),
    mock<DocumentVersionsRepository>(),
    confirmationTransaction,
    configurationRepository,
    broker,
    datetimeProvider,
  )
}

describe('Select Current Formalization Document Version Use Case', () => {
  it('blocks changing the current version after confirmation', async () => {
    const formalization = fakeFormalization({
      contractFormState: 'closed',
      documentsConfirmedAt: new Date(),
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    await expect(
      buildUseCase(repository).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        versionId: 'version',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('Reabra a confirmação')
  })

  it('blocks changing the current version for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      buildUseCase(repository).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        versionId: 'version',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('somente leitura')
  })

  it('synchronizes and schedules previews after selecting a current version', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed' })
    const version = DocumentVersionFaker.fake({
      documentId: 'document-1',
      status: 'approved',
      versionNumber: 2,
    })
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'formalization', formalizationId: formalization.id },
    })
    const packageDocument = PackageDocumentFaker.fake({
      documentPackageId: documentPackage.id,
      documentId: 'document-1',
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const documentPackagesRepository = mock<DocumentPackagesRepository>()
    const packageDocumentsRepository = mock<PackageDocumentsRepository>()
    const documentsRepository = mock<DocumentsRepository>()
    const versionsRepository = mock<DocumentVersionsRepository>()
    const confirmationTransaction = mock<FormalizationDocumentConfirmationTransaction>()
    const configurationRepository = mock<FormalizationSignatureConfigurationRepository>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    const now = new Date('2026-09-10T12:00:00.000Z')

    formalizationsRepository.findById.mockResolvedValue(formalization)
    versionsRepository.findById.mockResolvedValue(version)
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      packageDocument,
    ])
    documentsRepository.replace.mockResolvedValue({
      id: 'document-1',
      currentVersionId: version.id,
    } as never)
    confirmationTransaction.synchronizeCurrent.mockResolvedValue({
      formalization,
      pendingPreviewIds: ['preview-1'],
    })
    configurationRepository.schedulePendingPreview.mockResolvedValue({
      previewId: 'preview-1',
      attemptToken: 'attempt-1',
      leaseExpiresAt: now,
    })
    datetimeProvider.now.mockReturnValue(now)

    const useCase = new SelectCurrentFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
      confirmationTransaction,
      configurationRepository,
      broker,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        formalizationId: formalization.id,
        documentId: 'document-1',
        versionId: version.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toBe(version)

    expect(documentsRepository.replace).toHaveBeenCalledWith('document-1', {
      currentVersionId: version.id,
    })
    expect(confirmationTransaction.synchronizeCurrent).toHaveBeenCalledWith({
      formalizationId: formalization.id,
      occurredAt: now,
    })
    expect(configurationRepository.schedulePendingPreview).toHaveBeenCalledWith(
      'preview-1',
      now,
    )
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'formalization/signature-preview.batch-generation-requested',
        payload: expect.objectContaining({
          formalizationId: formalization.id,
          items: [{ previewId: 'preview-1', attemptToken: 'attempt-1' }],
        }),
      }),
    )
  })
})
