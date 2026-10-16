import type { ClientDocumentOriginsProvider } from '../interfaces'
import type { ResolveClientDocumentUseCase } from './resolve-client-document-use-case'
export class ReadClientDocumentUseCase {
  constructor(
    private readonly resolve: ResolveClientDocumentUseCase,
    private readonly origins: ClientDocumentOriginsProvider,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
    caseId: string
    documentId: string
  }) {
    const document = await this.resolve.execute({ ...request, forSelection: false })
    const bytes = await this.origins.read({ ...request, source: document.source })
    return { document, bytes }
  }
}
