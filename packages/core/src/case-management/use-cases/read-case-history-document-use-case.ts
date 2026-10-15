import type { UseCase } from '#shared/interfaces'
import { NotFoundError } from '#shared/domain/errors'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces'
import type { ClientDocument } from '../../document-engine/domain/entities'
import type { ClientDocumentSource } from '../../document-engine/domain/structures'
import type {
  LegalCasesRepository,
  CaseAccessProvider,
  CaseHistoriesRepository,
} from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'
type Request = { caseId: string; actorId: string; entryId: string; documentId: string }
type Response = { document: ClientDocument; bytes: Uint8Array }
export class ReadCaseHistoryDocumentUseCase implements UseCase<Request, Response> {
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly access: CaseAccessProvider,
    private readonly histories: CaseHistoriesRepository,
    private readonly documents: ClientDocumentsProvider,
  ) {}
  async execute(request: Request): Promise<Response> {
    await this.access.authorize({ ...request, intent: CaseAccessIntent.ReadDocument })
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new NotFoundError('Caso não encontrado.')
    const entry = await this.histories.findById(request.caseId, request.entryId)
    const reference = entry?.documents.find(
      (document) => document.clientDocumentId === request.documentId,
    )
    if (!entry || entry.caseId !== request.caseId || !reference)
      throw new NotFoundError('Documento não encontrado no histórico.')
    const result = await this.documents.read({ ...request, clientId: legalCase.clientId })
    if (
      result.document.id !== request.documentId ||
      result.document.clientId !== legalCase.clientId ||
      !this.isSameSource(reference.source, result.document.source)
    )
      throw new NotFoundError(
        'A referência documental não corresponde ao documento disponível.',
      )
    return result
  }
  private isSameSource(
    expected: ClientDocumentSource,
    actual: ClientDocumentSource,
  ): boolean {
    if (expected.kind !== actual.kind) return false
    switch (expected.kind) {
      case 'received_file':
        return actual.kind === 'received_file' && expected.fileId === actual.fileId
      case 'consultation_version':
        return (
          actual.kind === 'consultation_version' &&
          expected.consultationId === actual.consultationId &&
          expected.documentId === actual.documentId &&
          expected.versionId === actual.versionId
        )
      case 'formalization_signed':
        return (
          actual.kind === 'formalization_signed' &&
          expected.formalizationId === actual.formalizationId &&
          expected.requestDocumentId === actual.requestDocumentId &&
          expected.artifactId === actual.artifactId
        )
    }
  }
}
