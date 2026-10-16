import type { UseCase } from '../../shared/interfaces/use-case'
import type { DocumentValidationsRepository } from '../interfaces'
import { DocumentBatchChannel } from '../domain/structures'

type Request = { documentFileId: string; batchId: string }

export class ShouldProcessDocumentFileUseCase implements UseCase<Request, boolean> {
  constructor(private readonly validations: DocumentValidationsRepository) {}
  async execute(request: Request): Promise<boolean> {
    const document = await this.validations.findByFileId(request.documentFileId)
    if (!document || document.batchId !== request.batchId) return false
    return (
      document.channel !== DocumentBatchChannel.InternalUpload &&
      Object.values(DocumentBatchChannel).includes(document.channel)
    )
  }
}
