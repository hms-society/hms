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
import { ValidateChecklistDocumentUseCase } from '../validate-checklist-document-use-case'

describe('Validate Checklist Document Use Case', () => {
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
  let useCase: ValidateChecklistDocumentUseCase
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
    item.documentReference = {
      clientDocumentId: documentId,
      source: document.source,
      attachedAt: instant,
      attachedBy: actorId,
    }
    useCase = new ValidateChecklistDocumentUseCase(
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
        operationId,
        clientDocumentId: documentId,
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
        operationId,
        clientDocumentId: documentId,
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
        operationId,
        clientDocumentId: documentId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(items.replace).not.toHaveBeenCalled()
    expect(documents.confirmReceivedReview).not.toHaveBeenCalled()
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('rejects a racing compare-and-set and does not commit audit', async () => {
    items.replace.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        clientDocumentId: documentId,
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
      operationId,
      clientDocumentId: documentId,
      expectedUpdatedAt: instant.toISOString(),
    })
    const operation = operations.add.mock.calls[0][0]
    operations.find.mockResolvedValue({ id: 'operation-row', ...operation })
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        clientDocumentId: documentId,
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
        operationId,
        clientDocumentId: documentId,
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
      operationId,
      clientDocumentId: documentId,
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
        operationId,
        clientDocumentId: documentId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('validates only the current exact source after human confirmation', async () => {
    const result = await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      operationId,
      clientDocumentId: documentId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(result.status).toBe(CaseChecklistItemStatus.Validated)
    expect(result.validatedBy).toBe(actorId)
    expect(documents.resolve).toHaveBeenCalledWith({
      caseId,
      clientId,
      actorId,
      documentId,
      forSelection: false,
    })
  })
  it('rejects a changed association before source resolution', async () => {
    item.documentReference = undefined
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        clientDocumentId: documentId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(documents.resolve).not.toHaveBeenCalled()
  })
  it('blocks source permission loss without validating', async () => {
    documents.resolve.mockRejectedValue(new ForbiddenError('source denied'))
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        clientDocumentId: documentId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(items.replace).not.toHaveBeenCalled()
  })
  it('confirms the original received file only after exact item CAS and shares the authoritative review time', async () => {
    document.source = { kind: 'received_file', fileId: 'received-original' }
    const result = await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      operationId,
      clientDocumentId: documentId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(documents.confirmReceivedReview).toHaveBeenCalledExactlyOnceWith({
      documentId,
      clientId,
      caseId,
      checklistItemId: itemId,
      actorId,
      reviewedAt: result.validatedAt,
    })
    expect(items.replace.mock.invocationCallOrder[0]).toBeLessThan(
      documents.confirmReceivedReview.mock.invocationCallOrder[0],
    )
    expect(documents.confirmReceivedReview.mock.invocationCallOrder[0]).toBeLessThan(
      histories.add.mock.invocationCallOrder[0],
    )
  })
  it('does not change Motor state for a produced consultation version', async () => {
    document.source = {
      kind: 'consultation_version',
      consultationId: 'consultation',
      documentId: 'doc',
      versionId: 'version',
    }
    await useCase.execute({
      caseId,
      checklistItemId: itemId,
      actorId,
      operationId,
      clientDocumentId: documentId,
      expectedUpdatedAt: instant.toISOString(),
    })
    expect(documents.confirmReceivedReview).not.toHaveBeenCalled()
  })
  it('fails the enclosing transaction without operation or Case audit when original confirmation fails', async () => {
    document.source = { kind: 'received_file', fileId: 'received-original' }
    documents.confirmReceivedReview.mockRejectedValue(
      new ConflictError('Missing reviewer'),
    )
    await expect(
      useCase.execute({
        caseId,
        checklistItemId: itemId,
        actorId,
        operationId,
        clientDocumentId: documentId,
        expectedUpdatedAt: instant.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(histories.add).not.toHaveBeenCalled()
    expect(operations.add).not.toHaveBeenCalled()
  })
})
