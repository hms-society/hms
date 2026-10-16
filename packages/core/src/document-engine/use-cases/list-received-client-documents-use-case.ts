import type { DocumentBatchesRepository } from '../interfaces'
import type { ResolveReceivedClientDocumentUseCase } from './resolve-received-client-document-use-case'
import type { ClientDocumentOrigin } from '../domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
export class ListReceivedClientDocumentsUseCase {
  constructor(
    private readonly batches: DocumentBatchesRepository,
    private readonly resolve: ResolveReceivedClientDocumentUseCase,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
    caseId: string
  }): Promise<readonly ClientDocumentOrigin[]> {
    const results: ClientDocumentOrigin[] = []
    for (const batch of await this.batches.findById(request.clientId)) {
      for (const file of batch.files ?? []) {
        const source = await this.resolveReadable({
          ...request,
          fileId: file.id,
          forSelection: true,
        })
        if (source) results.push(source)
      }
    }
    return results
  }
  private async resolveReadable(
    request: Parameters<ResolveReceivedClientDocumentUseCase['execute']>[0],
  ) {
    try {
      return await this.resolve.execute(request)
    } catch (error) {
      if (!(error instanceof ForbiddenError) && !(error instanceof NotFoundError))
        throw error
      return undefined
    }
  }
}
