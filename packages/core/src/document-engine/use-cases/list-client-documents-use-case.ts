import type {
  ClientDocumentsRepository,
  ClientDocumentOriginsProvider,
} from '../interfaces'
import type { ClientDocumentSource } from '../domain/structures'
import type { ClientDocument } from '../domain/entities'
export class ListClientDocumentsUseCase {
  constructor(
    private readonly documents: ClientDocumentsRepository,
    private readonly origins: ClientDocumentOriginsProvider,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
    caseId: string
  }): Promise<readonly ClientDocument[]> {
    const results: ClientDocument[] = []
    for (const origin of await this.origins.list(request)) {
      results.push(
        await this.documents.add({ sourceKey: this.sourceKey(origin.source), origin }),
      )
    }
    return results
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
