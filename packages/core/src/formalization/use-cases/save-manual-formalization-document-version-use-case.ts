import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
} from '../../shared/interfaces'
import type { DocumentVersion } from '../../document-production/domain/entities'
import { FindDocumentPendingMarkersUseCase } from '../../document-production/use-cases'
import {
  DocumentVersionSource,
  DocumentVersionStatus,
  type DocumentTemplateContent,
} from '../../document-production/domain/structures'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly documentId: string
  readonly sourceDocumentVersionId: string
  readonly content: DocumentTemplateContent
}

export class SaveManualFormalizationDocumentVersionUseCase extends FormalizationUseCase<
  Request,
  DocumentVersion
> {
  private readonly findPendingMarkersUseCase = new FindDocumentPendingMarkersUseCase()

  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly documentFileExporter: DocumentFileExporter,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {
    super()
  }

  async execute(request: Request): Promise<DocumentVersion> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    this.assertWritable(formalization)
    if (formalization.documentsConfirmedAt) {
      throw new FormalizationStateConflictError(
        'Reabra a confirmação antes de editar documentos.',
      )
    }
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage)
      throw new FormalizationStateConflictError(
        'O documento não pertence à formalização.',
      )
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (
      !packageDocuments.some((document) => document.documentId === request.documentId)
    ) {
      throw new FormalizationStateConflictError(
        'O documento não pertence à formalização.',
      )
    }
    const [document, sourceVersion] = await Promise.all([
      this.documentsRepository.findById(request.documentId),
      this.versionsRepository.findById(request.sourceDocumentVersionId),
    ])
    if (!document || !sourceVersion || sourceVersion.documentId !== document.id) {
      throw new FormalizationStateConflictError(
        'A versão de origem não pertence ao documento.',
      )
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
        createdByCollaboratorId: request.actorId,
        createdAt: this.datetimeProvider.now(),
        status: DocumentVersionStatus.InReview,
      })
    } catch (error) {
      await this.fileStorageProvider.remove(file.id)
      throw error
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
