import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { FileStorageProvider } from '#shared/interfaces/file-storage-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentVersion } from '../../document-production/domain/entities'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import {
  type DocumentTemplateContent,
  DocumentVersionSource,
  DocumentVersionStatus,
} from '../../document-production/domain/structures'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { FindDocumentPendingMarkersUseCase } from '../../document-production/use-cases'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationDocumentNotFoundError,
  ConsultationNotFoundError,
  ConsultationPackageConfirmationError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly documentId: string
  readonly sourceDocumentVersionId: string
  readonly createdByCollaboratorId: string
  readonly createdByCollaboratorProfile: CollaboratorProfileValue
  readonly content: DocumentTemplateContent
}

export class SaveManualConsultationDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  private readonly findPendingMarkersUseCase = new FindDocumentPendingMarkersUseCase()

  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly documentFileExporter: DocumentFileExporter,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    await this.assertDocumentAccess(request)
    const [document, sourceVersion] = await Promise.all([
      this.documentsRepository.findById(request.documentId),
      this.versionsRepository.findById(request.sourceDocumentVersionId),
    ])
    if (!document || !sourceVersion || sourceVersion.documentId !== document.id) {
      throw new ConsultationDocumentNotFoundError()
    }

    const latestVersion = await this.versionsRepository.findLatestByDocumentId(
      document.id,
    )
    const versionNumber = (latestVersion?.versionNumber ?? 0) + 1
    const documentVersionId = this.idProvider.generate()
    const pendingMarkers = await this.findPendingMarkersUseCase.execute({
      content: request.content,
    })
    const exportedFile = await this.documentFileExporter.export({
      title: document.title,
      content: request.content,
    })
    const fileName = `${this.normalizeFileName(document.title)}-v${versionNumber}.${exportedFile.extension}`
    const file = await this.fileStorageProvider.save({
      filePath: `document-production/documents/${document.id}/manual/${documentVersionId}/${fileName}`,
      fileName,
      contentType: exportedFile.contentType,
      sizeInBytes: exportedFile.content.byteLength,
      content: exportedFile.content,
    })

    try {
      return await this.versionsRepository.add({
        id: documentVersionId,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        fileId: file.id,
        versionNumber,
        source: DocumentVersionSource.Manual,
        content: request.content,
        pendingMarkers,
        createdByCollaboratorId: request.createdByCollaboratorId,
        createdAt: this.datetimeProvider.now(),
        status: DocumentVersionStatus.InReview,
      })
    } catch (error) {
      await this.fileStorageProvider.remove(file.id)
      throw error
    }
  }

  private async assertDocumentAccess(request: Request): Promise<void> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.createdByCollaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.createdByCollaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    if (!documentPackage) throw new ConsultationDocumentNotFoundError()
    if (documentPackage.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos já foi confirmado e precisa ser reaberto antes de salvar uma nova versão.',
      )
    }
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (!packageDocuments.some(({ documentId }) => documentId === request.documentId)) {
      throw new ConsultationDocumentNotFoundError()
    }
  }

  private normalizeFileName(title: string): string {
    const normalized = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return normalized || 'documento'
  }
}
