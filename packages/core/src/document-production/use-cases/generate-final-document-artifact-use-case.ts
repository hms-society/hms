import type { DatetimeProvider, FileStorageProvider } from '../../shared/interfaces'
import { NotFoundError } from '../../shared/domain/errors'
import type { DocumentVersionHomologation } from '../domain/entities'
import type {
  DocumentFileExporter,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
} from '../interfaces'

type Request = {
  documentVersionId: string
}

export class GenerateFinalDocumentArtifactUseCase {
  constructor(
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly homologationsRepository: DocumentVersionHomologationsRepository,
    private readonly documentFileExporter: DocumentFileExporter,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<DocumentVersionHomologation> {
    const homologation = await this.homologationsRepository.findByDocumentVersionId(
      request.documentVersionId,
    )
    if (!homologation) {
      throw new NotFoundError('A versão documental ainda não foi homologada.')
    }
    if (homologation.artifactFileId) return homologation

    const [version, document] = await Promise.all([
      this.versionsRepository.findById(request.documentVersionId),
      this.documentsRepository.findById(homologation.documentId),
    ])
    if (!version || !document || version.documentId !== document.id) {
      throw new NotFoundError('A versão documental não foi encontrada.')
    }

    const exportedFile = await this.documentFileExporter.export({
      title: `${document.title} - versão final`,
      content: version.content,
      approval: {
        approvedByName: homologation.approvedByCollaboratorName,
        approvedByProfile: homologation.approvedByCollaboratorProfile,
        approvedAt: homologation.approvedAt,
      },
    })
    const fileName = `${this.normalizeFileName(document.title)}-final.${exportedFile.extension}`
    const file = await this.fileStorageProvider.save({
      filePath: `document-production/documents/${document.id}/final/${version.id}/${fileName}`,
      fileName,
      contentType: exportedFile.contentType,
      sizeInBytes: exportedFile.content.byteLength,
      content: exportedFile.content,
    })

    try {
      const updated = await this.homologationsRepository.attachArtifact(homologation.id, {
        fileId: file.id,
        storagePath: file.filePath,
        contentType: file.contentType,
        createdAt: this.datetimeProvider.now(),
      })
      if (!updated)
        throw new NotFoundError('A homologação documental não foi encontrada.')
      return updated
    } catch (error) {
      await this.fileStorageProvider.remove(file.id)
      throw error
    }
  }

  private normalizeFileName(title: string): string {
    return (
      title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'documento'
    )
  }
}
