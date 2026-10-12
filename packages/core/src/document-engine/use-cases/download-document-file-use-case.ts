import type { FileContent } from '#shared/domain/structures/file-content'
import type { StorageProvider } from '#shared/interfaces/storage-provider'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { DocumentFileNotFoundError } from '../domain/errors'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import type { DownloadDocumentFileRequest } from '../domain/structures'

type Request = DownloadDocumentFileRequest

export class DownloadDocumentFileUseCase {
  constructor(
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly storageProvider: StorageProvider,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute({ fileId, actorId }: Request): Promise<FileContent> {
    const validation = await this.documentValidationsRepository.findByFileId(fileId)
    if (validation?.checklistLink?.caseId) {
      await this.caseAccessProvider.authorize({
        caseId: validation.checklistLink.caseId,
        actorId,
        intent: CaseAccessIntent.ReadContent,
      })
    }

    const file = await this.documentBatchesRepository.findFileById(fileId)
    if (!file) throw new DocumentFileNotFoundError()

    const content = await this.storageProvider.download(file.storagePath)
    return { content, mimeType: file.mimeType, fileName: file.originalName }
  }
}
