import type { UseCase } from '#shared/interfaces/use-case'
import type { DocumentVersion } from '../../document-production/domain/entities'
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
import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
} from '../../shared/interfaces'
import { FindDocumentPendingMarkersUseCase } from '../../document-production/use-cases'
import { ForbiddenError } from '../../shared/domain/errors/forbidden-error'
import type { CollaboratorProfile as CollaboratorProfileValue } from '#shared/domain/structures'
import { LegalCaseDocumentGenerationError } from '../domain/errors/legal-case-document-generation-error'
import { LegalCaseNotFoundError } from '../domain/errors/legal-case-not-found-error'
import { CaseAccessIntent, LegalCaseStatus } from '../domain/structures'
import type { LegalCasesRepository } from '../interfaces'
import type { CaseAccessProvider } from '../interfaces'

type Request = {
  readonly caseId: string
  readonly documentId: string
  readonly sourceDocumentVersionId: string
  readonly createdByCollaboratorId: string
  readonly createdByCollaboratorProfile: CollaboratorProfileValue
  readonly content: DocumentTemplateContent
}
type ManualSource = {
  document: NonNullable<Awaited<ReturnType<DocumentsRepository['findById']>>>
  sourceVersion: NonNullable<Awaited<ReturnType<DocumentVersionsRepository['findById']>>>
}

export class SaveManualLegalCaseDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  private readonly findPendingMarkersUseCase = new FindDocumentPendingMarkersUseCase()

  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly versions: DocumentVersionsRepository,
    private readonly exporter: DocumentFileExporter,
    private readonly storage: FileStorageProvider,
    private readonly datetime: DatetimeProvider,
    private readonly ids: IdProvider,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    if (legalCase.status === LegalCaseStatus.Closed) {
      throw new ForbiddenError('Casos encerrados permitem apenas leitura.')
    }
    await this.caseAccessProvider.authorize({
      caseId: legalCase.id,
      actorId: request.createdByCollaboratorId,
      intent: CaseAccessIntent.WriteContent,
    })
    const source = await this.findManualSource(request, legalCase.id)
    return this.persistManualVersion(request, source)
  }

  private async findManualSource(
    request: Request,
    caseId: string,
  ): Promise<ManualSource> {
    const documentPackage = await this.packages.findByContext({
      type: 'case',
      caseId,
    })
    if (!documentPackage) throw new LegalCaseNotFoundError()
    const packageDocuments = await this.packageDocuments.findByDocumentPackageId(
      documentPackage.id,
    )
    if (!packageDocuments.some(({ documentId }) => documentId === request.documentId)) {
      throw new LegalCaseNotFoundError()
    }

    const [document, sourceVersion] = await Promise.all([
      this.documents.findById(request.documentId),
      this.versions.findById(request.sourceDocumentVersionId),
    ])
    if (
      !document ||
      !sourceVersion ||
      sourceVersion.documentId !== document.id ||
      !(await this.versions.findByDocumentIds([document.id])).some(
        ({ id }) => id === sourceVersion.id,
      )
    ) {
      throw new LegalCaseDocumentGenerationError(
        'A versão de origem não pertence a esta peça.',
      )
    }
    return { document, sourceVersion }
  }

  private async persistManualVersion(
    request: Request,
    source: ManualSource,
  ): Promise<DocumentVersion> {
    const { document, sourceVersion } = source
    const latestVersion = await this.versions.findLatestByDocumentId(document.id)
    const versionNumber = (latestVersion?.versionNumber ?? 0) + 1
    const versionId = this.ids.generate()
    const pendingMarkers = await this.findPendingMarkersUseCase.execute({
      content: request.content,
    })
    const exportedFile = await this.exporter.export({
      title: document.title,
      content: request.content,
    })
    const fileName = `${this.normalizeFileName(document.title)}-v${versionNumber}.${exportedFile.extension}`
    const file = await this.storage.save({
      filePath: `document-production/documents/${document.id}/manual/${versionId}/${fileName}`,
      fileName,
      contentType: exportedFile.contentType,
      sizeInBytes: exportedFile.content.byteLength,
      content: exportedFile.content,
    })

    return this.addManualVersion(
      request,
      document,
      sourceVersion,
      file,
      versionId,
      versionNumber,
      pendingMarkers,
    )
  }

  private async addManualVersion(
    request: Request,
    document: ManualSource['document'],
    sourceVersion: ManualSource['sourceVersion'],
    file: Awaited<ReturnType<FileStorageProvider['save']>>,
    versionId: string,
    versionNumber: number,
    pendingMarkers: Awaited<ReturnType<FindDocumentPendingMarkersUseCase['execute']>>,
  ): Promise<DocumentVersion> {
    try {
      return await this.versions.add({
        id: versionId,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        fileId: file.id,
        storagePath: file.filePath,
        versionNumber,
        source: DocumentVersionSource.Manual,
        content: request.content,
        pendingMarkers,
        createdByCollaboratorId: request.createdByCollaboratorId,
        createdAt: this.datetime.now(),
        status: DocumentVersionStatus.Draft,
      })
    } catch (error) {
      await this.storage.remove(file.id)
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
