import type { UseCase, DatetimeProvider } from '#shared/interfaces'
import { BadRequestError, ConflictError, NotFoundError } from '#shared/domain/errors'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces'
import type {
  LegalCasesRepository,
  CaseAccessProvider,
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
  CaseCollaboratorsProvider,
} from '../interfaces'
import type { CaseHistoryEntry } from '../domain/entities'
import {
  CaseAccessIntent,
  CaseHistoryCategory,
  CaseHistoryKind,
} from '../domain/structures'
type Request = {
  caseId: string
  actorId: string
  operationId: string
  occurredAt: string
  description: string
  documentIds: readonly string[]
}
export class RegisterCaseUpdateUseCase implements UseCase<Request, CaseHistoryEntry> {
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly access: CaseAccessProvider,
    private readonly histories: CaseHistoriesRepository,
    private readonly transaction: CaseHistoryTransactionProvider,
    private readonly documents: ClientDocumentsProvider,
    private readonly collaborators: CaseCollaboratorsProvider,
    private readonly datetime: DatetimeProvider,
  ) {}
  async execute(request: Request): Promise<CaseHistoryEntry> {
    return this.transaction.runInTransaction(() => this.recordUpdate(request))
  }
  private async recordUpdate(request: Request): Promise<CaseHistoryEntry> {
    await this.access.authorize({ ...request, intent: CaseAccessIntent.WriteContent })
    const now = this.datetime.now()
    const description = request.description.trim()
    const occurredAt = new Date(request.occurredAt)
    const documentIds = [...new Set(request.documentIds)].sort()
    this.validateUpdate(request, description, occurredAt, documentIds, now)
    const fingerprint = JSON.stringify({
      description,
      occurredAt: occurredAt.toISOString(),
      documentIds,
    })
    const previous = await this.histories.findManualOperation(
      request.caseId,
      request.actorId,
      request.operationId,
    )
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new ConflictError('A operação já foi usada para outro andamento.')
      return this.projectEntry(previous)
    }
    return this.appendUpdate(request, {
      description,
      occurredAt,
      documentIds,
      now,
      fingerprint,
    })
  }
  private async appendUpdate(
    request: Request,
    normalized: {
      description: string
      occurredAt: Date
      documentIds: readonly string[]
      now: Date
      fingerprint: string
    },
  ): Promise<CaseHistoryEntry> {
    const { description, occurredAt, documentIds, now, fingerprint } = normalized
    const references = await this.resolveReferences(request, documentIds)
    const actor = await this.collaborators.findById(request.actorId)
    const record = await this.histories.add({
      caseId: request.caseId,
      kind: CaseHistoryKind.ManualUpdate,
      category: CaseHistoryCategory.Manual,
      occurredAt,
      recordedAt: now,
      actorId: request.actorId,
      actorName: actor?.professionalName,
      title: 'Andamento registrado',
      description,
      documents: references,
      operationId: request.operationId,
      fingerprint,
      sourceKey: `manual:${request.actorId}:${request.operationId}`,
    })
    return this.projectEntry(record)
  }
  private validateUpdate(
    request: Request,
    description: string,
    occurredAt: Date,
    documentIds: readonly string[],
    now: Date,
  ): void {
    if (
      !description ||
      description.length > 5000 ||
      !Number.isFinite(occurredAt.getTime()) ||
      occurredAt > now ||
      !this.isValidOccurrence(request.occurredAt) ||
      request.documentIds.length > 20 ||
      !this.isUuid(request.operationId) ||
      documentIds.some((id) => !this.isUuid(id))
    ) {
      throw new BadRequestError(
        'Andamento inválido. Informe data passada, descrição e documentos válidos.',
      )
    }
  }
  private async resolveReferences(
    request: Request,
    documentIds: readonly string[],
  ): Promise<import('../domain/structures').CaseHistoryDocumentReference[]> {
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new NotFoundError('Caso não encontrado.')
    const references: import('../domain/structures').CaseHistoryDocumentReference[] = []
    for (const documentId of documentIds) {
      const document = await this.documents.resolve({
        caseId: request.caseId,
        actorId: request.actorId,
        clientId: legalCase.clientId,
        documentId,
        forSelection: true,
      })
      if (document.clientId !== legalCase.clientId || document.id !== documentId)
        throw new NotFoundError('Documento não encontrado.')
      references.push({
        clientDocumentId: document.id,
        name: document.name,
        source: { ...document.source },
      })
    }
    return references
  }
  private projectEntry(
    record: import('../domain/entities').CaseHistoryRecord,
  ): CaseHistoryEntry {
    const {
      sourceKey: _sourceKey,
      operationId: _operationId,
      fingerprint: _fingerprint,
      ...entry
    } = record
    return entry
  }
  private isValidOccurrence(value: string): boolean {
    const parts =
      /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
        value,
      )
    if (!parts) return false
    const year = Number(parts[1])
    const month = Number(parts[2])
    const day = Number(parts[3])
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    const days =
      [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0
    return month >= 1 && month <= 12 && day >= 1 && day <= days
  }
  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  }
}
