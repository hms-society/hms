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
import { ConflictError } from '../../../shared/domain/errors/conflict-error'
import { CaseChecklistItemStatus } from '../../domain/structures'
import { PrepareChecklistDocumentUploadUseCase } from '../prepare-checklist-document-upload-use-case'

describe('Prepare Checklist Document Upload Use Case', () => {
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
  const operationId = '00000000-0000-4000-8000-000000000005'
  const documentId = '00000000-0000-4000-8000-000000000006'
  const instant = new Date('2026-10-12T12:00:00.000Z')
  let item = CaseChecklistItemFaker.fake()
  let document = ClientDocumentFaker.fake()
  let useCase: PrepareChecklistDocumentUploadUseCase
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
    useCase = new PrepareChecklistDocumentUploadUseCase(cases, items, access, documents)
  })
  it('denies access before resolving sources or mutating persistence', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(documents.resolve).not.toHaveBeenCalled()
    expect(items.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('rejects an absent or foreign item before source resolution', async () => {
    items.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      }),
    ).rejects.toThrow('O caso ou item')
    expect(documents.resolve).not.toHaveBeenCalled()
  })
  it('rejects replacing a validated item before preparing storage', async () => {
    item.status = CaseChecklistItemStatus.Validated
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(documents.prepareUpload).not.toHaveBeenCalled()
  })
  it('prepares an inherited target without accepting client identity input', async () => {
    await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      operationId,
      name: 'proof.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    })
    expect(documents.prepareUpload).toHaveBeenCalledWith({
      ...{
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      },
      clientId,
    })
  })
})
