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
import { AttachChecklistDocumentUseCase } from '../attach-checklist-document-use-case'

describe('Attach Checklist Document Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let items: MockProxy<CaseChecklistItemsRepository>
  let access: MockProxy<CaseAccessProvider>
  let documents: MockProxy<ClientDocumentsProvider>
  let operations: MockProxy<ChecklistDocumentOperationsRepository>
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
  let useCase: AttachChecklistDocumentUseCase
  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    items = mock<CaseChecklistItemsRepository>()
    access = mock<CaseAccessProvider>()
    documents = mock<ClientDocumentsProvider>()
    operations = mock<ChecklistDocumentOperationsRepository>()
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
    useCase = new AttachChecklistDocumentUseCase(
      cases,
      items,
      access,
      documents,
      operations,
      histories,
      transaction,
      datetime,
    )
  })
  it('denies access before resolving sources or mutating persistence', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
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
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toThrow('O caso ou item')
    expect(documents.resolve).not.toHaveBeenCalled()
  })
  it('rejects stale revision without committing history or operation', async () => {
    item.updatedAt = new Date(instant.getTime() + 1)
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(items.replace).not.toHaveBeenCalled()
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('rejects a racing compare-and-set and does not commit audit', async () => {
    items.replace.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(histories.add).not.toHaveBeenCalled()
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('preserves operation replay after reauthorization without another mutation', async () => {
    const result = await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      kind: 'existing' as const,
      documentId,
      operationId,
      expectedUpdatedAt: instant.toISOString(),
    })
    const operation = operations.add.mock.calls[0][0]
    operations.find.mockResolvedValue({ id: 'operation-row', ...operation })
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).resolves.toEqual(result)
    expect(items.replace).toHaveBeenCalledTimes(1)
    expect(histories.add).toHaveBeenCalledTimes(1)
  })
  it('conflicts on reused operation with different payload', async () => {
    operations.find.mockResolvedValue({
      id: 'operation-row',
      caseId,
      actorId,
      operationId,
      fingerprint: 'other',
      result: item,
      createdAt: instant,
    })
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(items.replace).not.toHaveBeenCalled()
  })
  it('keeps timestamp increasing even when the injected clock goes backward', async () => {
    datetime.now.mockReturnValue(new Date(instant.getTime() - 1000))
    const result = await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      kind: 'existing' as const,
      documentId,
      operationId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(result.updatedAt.toISOString()).toBe('2026-10-12T12:00:00.001Z')
  })
  it('propagates a failed history commit rather than returning success', async () => {
    histories.add.mockRejectedValue(new ConflictError('rollback'))
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('attaches a globally approved source as pending without adequacy metadata', async () => {
    const result = await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      kind: 'existing' as const,
      documentId,
      operationId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(result.status).toBe(CaseChecklistItemStatus.Pending)
    expect(result.validatedAt).toBeUndefined()
    expect(result.validatedBy).toBeUndefined()
    expect(result.documentReference?.clientDocumentId).toBe(documentId)
  })
  it('rejects replacement of a validated item', async () => {
    item.status = CaseChecklistItemStatus.Validated
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        kind: 'existing' as const,
        documentId,
        operationId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(documents.resolve).not.toHaveBeenCalled()
  })
  it('preserves a produced version identity without a fabricated Motor file id', async () => {
    document.source = {
      kind: 'consultation_version',
      consultationId: 'consultation',
      documentId: 'source-document',
      versionId: 'version',
    }
    const result = await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      kind: 'existing' as const,
      documentId,
      operationId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(result.documentFileId).toBeUndefined()
    expect(result.documentReference?.source).toEqual(document.source)
  })
  it('confirms an upload under inherited context before the atomic association', async () => {
    await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      kind: 'upload',
      uploadId: 'upload',
      operationId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(documents.completeUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId,
        checklistItemId: itemId,
        actorId,
        clientId,
        uploadId: 'upload',
      }),
    )
  })
})
