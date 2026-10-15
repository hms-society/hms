import type { ClientDocumentSource } from '../domain/structures'
import type {
  ClientDocumentsRepository,
  ClientDocumentOriginsProvider,
} from '../interfaces'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type { ClientDocument } from '../domain/entities'
export class ResolveClientDocumentUseCase {
  constructor(
    private readonly documents: ClientDocumentsRepository,
    private readonly origins: ClientDocumentOriginsProvider,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
    caseId: string
    documentId: string
    forSelection: boolean
  }): Promise<ClientDocument> {
    const document = await this.documents.findById(request.documentId)
    if (!document || document.clientId !== request.clientId)
      throw new NotFoundError('Documento indisponível.')
    const origin = await this.origins.resolve({ ...request, source: document.source })
    if (
      origin.clientId !== request.clientId ||
      this.sourceKey(origin.source) !== this.sourceKey(document.source)
    )
      throw new NotFoundError('Documento indisponível.')
    return document
  }
  private sourceKey(source: ClientDocumentSource): string {
    if (source.kind === 'received_file')
      return JSON.stringify([source.kind, source.fileId])
    if (source.kind === 'consultation_version')
      return JSON.stringify([
        source.kind,
        source.consultationId,
        source.documentId,
        source.versionId,
      ])
    return JSON.stringify([
      source.kind,
      source.formalizationId,
      source.requestDocumentId,
      source.artifactId,
    ])
  }
}
