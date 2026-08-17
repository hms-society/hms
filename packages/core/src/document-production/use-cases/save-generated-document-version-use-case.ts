import type { FileStorageProvider } from '#shared/interfaces/file-storage-provider'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentVersion } from '../domain/entities'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
} from '../domain/errors'
import {
  DocumentGenerationStatus,
  type DocumentPendingMarker,
  type DocumentTemplateContent,
  DocumentVersionSource,
  DocumentVersionStatus,
} from '../domain/structures'
import type {
  DocumentFileExporter,
  DocumentGenerationsRepository,
  DocumentVersionsRepository,
} from '../interfaces'

type Request = {
  readonly documentGenerationId: string
  readonly content: DocumentTemplateContent
  readonly pendingMarkers: readonly DocumentPendingMarker[]
}

export class SaveGeneratedDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly documentFileExporter: DocumentFileExporter,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const generation = await this.generationsRepository.findById(
      request.documentGenerationId,
    )

    if (!generation) throw new DocumentGenerationNotFoundError()
    if (generation.status !== DocumentGenerationStatus.Running) {
      throw new DocumentGenerationConflictError(
        'Somente uma geração em andamento pode produzir uma versão documental.',
      )
    }

    const existingVersion = await this.versionsRepository.findByDocumentGenerationId(
      generation.id,
    )
    if (existingVersion) return existingVersion

    const latestVersion = await this.versionsRepository.findLatestByDocumentId(
      generation.documentId,
    )
    const versionNumber = (latestVersion?.versionNumber ?? 0) + 1
    const exportedFile = await this.documentFileExporter.export({
      title: generation.template.name,
      content: request.content,
    })
    const fileName = `${this.normalizeFileName(generation.template.name)}-v${versionNumber}.${exportedFile.extension}`
    const file = await this.fileStorageProvider.save({
      filePath: `document-production/documents/${generation.documentId}/generations/${generation.id}/${fileName}`,
      fileName,
      contentType: exportedFile.contentType,
      sizeInBytes: exportedFile.content.byteLength,
      content: exportedFile.content,
    })

    return this.versionsRepository.add({
      documentId: generation.documentId,
      documentGenerationId: generation.id,
      fileId: file.id,
      versionNumber,
      source: DocumentVersionSource.Ai,
      content: request.content,
      pendingMarkers: request.pendingMarkers,
      createdByCollaboratorId: generation.requestedByCollaboratorId,
      createdAt: this.datetimeProvider.now(),
      status: DocumentVersionStatus.InReview,
    })
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
