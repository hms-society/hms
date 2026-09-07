import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import {
  DocumentFaker,
  DocumentGenerationFaker,
  DocumentVersionFaker,
} from '../../../document-production/domain/entities/fakers'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentGenerationsRepository,
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
import { ConfirmFormalizationDocumentsUseCase } from '../confirm-formalization-documents-use-case'

describe('Confirm Formalization Documents Use Case', () => {
  it('requires at least one selected document', async () => {
    const formalization = fakeFormalization({
      contractFormState: 'closed',
      contractFormRevision: 1,
    })
    const repository = mock<FormalizationsRepository>()
    const packagesRepository = mock<DocumentPackagesRepository>()
    repository.findById.mockResolvedValue(formalization)
    packagesRepository.findByContext.mockResolvedValue(undefined)
    await expect(
      new ConfirmFormalizationDocumentsUseCase(
        repository,
        packagesRepository,
        mock<PackageDocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).rejects.toThrow('Selecione ao menos um documento')
  })

  it('blocks confirmation for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new ConfirmFormalizationDocumentsUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).rejects.toThrow('somente leitura')
  })

  it('validates the selected current version and publishes pending previews after the transaction', async () => {
    const formalization = fakeFormalization({
      contractFormState: 'closed',
      contractFormRevision: 1,
    })
    const document = DocumentFaker.fake({ currentVersionId: 'version-id' })
    const generation = DocumentGenerationFaker.fake({
      id: 'generation-id',
      documentId: document.id,
      source: {
        type: 'formalization',
        id: formalization.id,
        data: {
          formalization: {
            id: formalization.id,
            contractFormRevision: formalization.contractFormRevision,
          },
        },
      },
    })
    const version = DocumentVersionFaker.fake({
      id: 'version-id',
      documentId: document.id,
      documentGenerationId: generation.id,
      status: 'approved',
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const packagesRepository = mock<DocumentPackagesRepository>()
    const packageDocumentsRepository = mock<PackageDocumentsRepository>()
    const versionsRepository = mock<DocumentVersionsRepository>()
    const generationsRepository = mock<DocumentGenerationsRepository>()
    const documentsRepository = mock<DocumentsRepository>()
    const transaction = mock<FormalizationDocumentConfirmationTransaction>()
    const signatureRepository = mock<FormalizationSignatureConfigurationRepository>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    const now = new Date('2026-08-24T13:00:00.000Z')
    const confirmed = { ...formalization, documentsConfirmedAt: now }
    formalizationsRepository.findById.mockResolvedValue(formalization)
    packagesRepository.findByContext.mockResolvedValue({
      id: 'package-id',
      context: { type: 'formalization', formalizationId: formalization.id },
      documents: [],
      createdAt: now,
      updatedAt: now,
    })
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      {
        id: 'package-document-id',
        documentPackageId: 'package-id',
        documentId: document.id,
        documentSpecificationId: 'specification-id',
        createdAt: now,
        updatedAt: now,
      },
    ])
    versionsRepository.findByDocumentIds.mockResolvedValue([version])
    documentsRepository.findByIds.mockResolvedValue([document])
    generationsRepository.findById.mockResolvedValue(generation)
    datetimeProvider.now.mockReturnValue(now)
    transaction.confirm.mockResolvedValue({
      formalization: confirmed,
      pendingPreviewIds: ['preview-id'],
    })
    signatureRepository.schedulePendingPreview.mockResolvedValue({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      leaseExpiresAt: new Date(now.getTime() + 1000),
    })

    await expect(
      new ConfirmFormalizationDocumentsUseCase(
        formalizationsRepository,
        packagesRepository,
        packageDocumentsRepository,
        versionsRepository,
        generationsRepository,
        datetimeProvider,
        documentsRepository,
        transaction,
        signatureRepository,
        broker,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(confirmed)
    expect(transaction.confirm).toHaveBeenCalledWith({
      formalizationId: formalization.id,
      expectedVersion: formalization.version,
      actorId: formalization.assignedLawyerId,
      occurredAt: now,
    })
    expect(broker.publish).toHaveBeenCalledOnce()
  })
})
