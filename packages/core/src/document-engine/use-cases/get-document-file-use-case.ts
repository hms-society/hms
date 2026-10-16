import type { UseCase } from '#shared/interfaces'
import type { DocumentBatchFile } from '../domain/entities'
import { DocumentFileNotFoundError } from '../domain/errors'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import type { DownloadDocumentFileRequest } from '../domain/structures'

type Request = DownloadDocumentFileRequest

export class GetDocumentFileUseCase implements UseCase<Request, DocumentBatchFile> {
  constructor(
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute({ fileId, actorId }: Request): Promise<DocumentBatchFile> {
    const validation = await this.documentValidationsRepository.findByFileId(fileId)
    if (validation?.checklistLink?.caseId) {
      await this.caseAccessProvider.authorize({
        caseId: validation.checklistLink.caseId,
        actorId,
        intent: CaseAccessIntent.ReadDocument,
      })
    }

    const file = await this.documentBatchesRepository.findFileById(fileId)
    if (!file) {
      throw new DocumentFileNotFoundError()
    }
    return file
  }
}
