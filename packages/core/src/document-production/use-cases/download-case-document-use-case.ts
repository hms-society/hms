import type { UseCase } from '#shared/interfaces/use-case'
import type { FileContent } from '#shared/domain/structures/file-content'
import type { StorageProvider } from '#shared/interfaces/storage-provider'
import type { CaseDocumentActorRequest } from '../domain/structures'
import type { GetCaseDocumentUseCase } from './get-case-document-use-case'
import { NotFoundError } from '../../shared/domain/errors/not-found-error'

type Request = CaseDocumentActorRequest & { versionId?: string }

export class DownloadCaseDocumentUseCase implements UseCase<Request, FileContent> {
  constructor(
    private readonly getCaseDocument: GetCaseDocumentUseCase,
    private readonly storageProvider: StorageProvider,
  ) {}

  async execute(request: Request): Promise<FileContent> {
    const item = await this.getCaseDocument.execute(request)
    const version = request.versionId
      ? item.versions.find((candidate) => candidate.id === request.versionId)
      : item.versions.reduce<(typeof item.versions)[number] | undefined>(
          (latest, candidate) =>
            !latest || candidate.versionNumber > latest.versionNumber
              ? candidate
              : latest,
          undefined,
        )

    if (!version?.storagePath) {
      throw new NotFoundError(
        'O arquivo desta versão ainda não está associado ao Storage.',
      )
    }

    const mimeType = version.storagePath.endsWith('.pdf')
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    return {
      content: await this.storageProvider.download(version.storagePath),
      mimeType,
    }
  }
}
