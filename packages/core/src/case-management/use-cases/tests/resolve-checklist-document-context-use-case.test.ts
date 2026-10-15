import { beforeEach, describe, it, expect } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
  ChecklistDocumentOperationsRepository,
  ChecklistDocumentHistoriesRepository,
  ChecklistDocumentTransactionProvider,
} from '../../interfaces'
import type { ClientDocumentsProvider } from '../../../document-engine/interfaces/client-documents-provider'
import type { DatetimeProvider } from '../../../shared/interfaces/datetime-provider'
import { LegalCaseFaker, CaseChecklistItemFaker } from '../../domain/entities/fakers'
import { ClientDocumentFaker } from '../../../document-engine/domain/entities/fakers/client-document-faker'
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { CaseAccessIntent, LegalCaseStatus } from '../../domain/structures'
import { ResolveChecklistDocumentContextUseCase } from '../resolve-checklist-document-context-use-case'

describe('Resolve Checklist Document Context Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let items: MockProxy<CaseChecklistItemsRepository>
  let access: MockProxy<CaseAccessProvider>
  let documents: MockProxy<ClientDocumentsProvider>
  let _operations: MockProxy<ChecklistDocumentOperationsRepository>
  let histories: MockProxy<ChecklistDocumentHistoriesRepository>
  let transaction: MockProxy<ChecklistDocumentTransactionProvider>
  let datetime: MockProxy<DatetimeProvider>
  const caseId = '00000000-0000-4000-8000-000000000001'
  const actorId = '00000000-0000-4000-8000-000000000002'
  const itemId = '00000000-0000-4000-8000-000000000003'
  const clientId = '00000000-0000-4000-8000-000000000004'
  const _operationId = '00000000-0000-4000-8000-000000000005'
  const documentId = '00000000-0000-4000-8000-000000000006'
  const instant = new Date('2026-10-12T12:00:00.000Z')
  let item = CaseChecklistItemFaker.fake()
  let document = ClientDocumentFaker.fake()
  let useCase: ResolveChecklistDocumentContextUseCase
  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    items = mock<CaseChecklistItemsRepository>()
    access = mock<CaseAccessProvider>()
    documents = mock<ClientDocumentsProvider>()
    _operations = mock<ChecklistDocumentOperationsRepository>()
    histories = mock<ChecklistDocumentHistoriesRepository>()
    transaction = mock<ChecklistDocumentTransactionProvider>()
    datetime = mock<DatetimeProvider>()
    item = CaseChecklistItemFaker.fake({ id: itemId, caseId, updatedAt: instant })
    document = ClientDocumentFaker.fake({ id: documentId, clientId })
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: caseId, clientId }))
    items.findById.mockResolvedValue(item)
    datetime.now.mockReturnValue(instant)
    transaction.runInTransaction.mockImplementation(async (operation) => operation())
    documents.resolve.mockResolvedValue(document)
    documents.completeUpload.mockResolvedValue(document)
    documents.listAvailable.mockResolvedValue([document])
    documents.read.mockResolvedValue({ document, bytes: new Uint8Array([1, 2, 3]) })
    items.replace.mockImplementation(async (_id, changes) => ({ ...item, ...changes }))
    useCase = new ResolveChecklistDocumentContextUseCase(cases, items, access)
  })
  it('denies access before resolving sources or mutating persistence', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(
      useCase.execute({ caseId, checklistItemId: itemId, actorId, write: true }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(documents.resolve).not.toHaveBeenCalled()
    expect(items.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('rejects an absent or foreign item before source resolution', async () => {
    items.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ caseId, checklistItemId: itemId, actorId, write: true }),
    ).rejects.toThrow('O caso ou item')
    expect(documents.resolve).not.toHaveBeenCalled()
  })
  it('resolves inherited client and checks member write intent', async () => {
    await expect(
      useCase.execute({ caseId, checklistItemId: itemId, actorId, write: true }),
    ).resolves.toEqual({ item, clientId })
    expect(access.authorize).toHaveBeenCalledWith({
      caseId,
      actorId,
      intent: CaseAccessIntent.WriteContent,
    })
  })
  it('requires documentary read permission for an attached item in a closed Case', async () => {
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, clientId, status: LegalCaseStatus.Closed }),
    )
    await expect(
      useCase.execute({ caseId, checklistItemId: itemId, actorId, write: false }),
    ).resolves.toEqual({ item, clientId })
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId,
      actorId,
      intent: CaseAccessIntent.ReadDocument,
    })
  })

  it('denies an operational-only Admin before reading the Case or attachment', async () => {
    access.authorize.mockImplementation(async ({ intent }) => {
      if (intent === CaseAccessIntent.ReadDocument) throw new ForbiddenError('Denied')
    })
    await expect(
      useCase.execute({ caseId, checklistItemId: itemId, actorId, write: false }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(cases.findById).not.toHaveBeenCalled()
    expect(items.findById).not.toHaveBeenCalled()
  })
})
