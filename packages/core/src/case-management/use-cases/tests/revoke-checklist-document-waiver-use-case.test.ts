import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockReset } from 'vitest-mock-extended'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
  CaseCollaboratorsProvider,
  ChecklistDocumentOperationsRepository,
  ChecklistDocumentHistoriesRepository,
  ChecklistDocumentTransactionProvider,
} from '../../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'
import { ConflictError, ForbiddenError } from '#shared/domain/errors'
import { LegalCaseFaker, CaseChecklistItemFaker } from '../../domain/entities/fakers'
import { CaseAccessIntent, CaseChecklistItemStatus } from '../../domain/structures'
import { RevokeChecklistDocumentWaiverUseCase } from '../revoke-checklist-document-waiver-use-case'
const caseId = '00000000-0000-4000-8000-000000000001'
const itemId = '00000000-0000-4000-8000-000000000002'
const actorId = '00000000-0000-4000-8000-000000000003'
const operationId = '00000000-0000-4000-8000-000000000004'
const now = new Date('2026-10-13T12:00:00Z')
const waiver = {
  justification: 'Documento impossível',
  actorId,
  actorName: 'Gestor Solo',
  grantedAt: now,
}
describe('Revoke Checklist Document Waiver Use Case', () => {
  const cases = mock<LegalCasesRepository>()
  const items = mock<CaseChecklistItemsRepository>()
  const access = mock<CaseAccessProvider>()
  const collaborators = mock<CaseCollaboratorsProvider>()
  const operations = mock<ChecklistDocumentOperationsRepository>()
  const histories = mock<ChecklistDocumentHistoriesRepository>()
  const transaction = mock<ChecklistDocumentTransactionProvider>()
  const datetime = mock<DatetimeProvider>()
  let item = CaseChecklistItemFaker.fake({
    id: itemId,
    caseId,
    updatedAt: now,
    status: CaseChecklistItemStatus.Waived,
    waiver,
  })
  let useCase: RevokeChecklistDocumentWaiverUseCase
  const request = {
    caseId,
    checklistItemId: itemId,
    actorId,
    operationId,
    expectedUpdatedAt: now.toISOString(),
  }
  beforeEach(() => {
    for (const dependency of [
      cases,
      items,
      access,
      operations,
      histories,
      transaction,
      datetime,
    ])
      mockReset(dependency)
    item = CaseChecklistItemFaker.fake({
      id: itemId,
      caseId,
      updatedAt: now,
      status: CaseChecklistItemStatus.Waived,
      waiver,
    })
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: caseId }))
    items.findById.mockImplementation(async () => item)
    items.replace.mockImplementation(async (_id, changes) => ({ ...item, ...changes }))
    collaborators.findById.mockResolvedValue({
      collaboratorId: actorId,
      professionalName: 'Gestor Solo',
      email: 'solo@example.invalid',
      profile: 'lawyer',
      status: 'active',
    })
    datetime.now.mockReturnValue(now)
    transaction.runInTransaction.mockImplementation(async (operation) => operation())
    useCase = new RevokeChecklistDocumentWaiverUseCase(
      cases,
      items,
      access,
      operations,
      histories,
      transaction,
      datetime,
    )
  })
  it('revokes the waiver and preserves the actual document association', async () => {
    const result = await useCase.execute(request)
    expect(result.status).toBe(CaseChecklistItemStatus.Pending)
    expect(result.waiver).toBeUndefined()
    expect(result.documentReference).toEqual(item.documentReference)
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId,
      actorId,
      intent: CaseAccessIntent.ManageDocumentException,
    })
    expect(histories.add).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        action: 'waiver_revoked',
        actorId,
        reference: result.waiver ?? waiver,
      }),
    )
    expect(operations.add).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ kind: 'waiver', operationId, result }),
    )
  })
  it('replays the identical operation without rewriting item or audit', async () => {
    const fingerprint = JSON.stringify([
      'revoke-checklist-document-waiver',
      itemId,
      request.expectedUpdatedAt,
    ])
    const result = { ...item }
    operations.find.mockResolvedValue({
      id: operationId,
      caseId,
      actorId,
      operationId,
      kind: 'waiver',
      fingerprint,
      result,
      createdAt: now,
    })
    await expect(useCase.execute(request)).resolves.toEqual(result)
    expect(items.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('rejects a mismatched replay without any mutation', async () => {
    operations.find.mockResolvedValue({
      id: operationId,
      caseId,
      actorId,
      operationId,
      kind: 'waiver',
      fingerprint: 'different',
      result: item,
      createdAt: now,
    })
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(items.replace).not.toHaveBeenCalled()
  })
  it('denies lost authority before checking prior success or changing the requirement', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ForbiddenError)
    expect(operations.find).not.toHaveBeenCalled()
    expect(items.replace).not.toHaveBeenCalled()
  })
  it('rejects a stale item revision', async () => {
    await expect(
      useCase.execute({ ...request, expectedUpdatedAt: '2026-10-12T12:00:00Z' }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(items.replace).not.toHaveBeenCalled()
  })
  it('rejects late CAS failure without writing audit or replay state', async () => {
    items.replace.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(histories.add).not.toHaveBeenCalled()
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('propagates audit failure through the atomic transaction', async () => {
    histories.add.mockRejectedValue(new Error('Audit outage'))
    await expect(useCase.execute(request)).rejects.toThrow('Audit outage')
    expect(operations.add).not.toHaveBeenCalled()
  })
  it('rejects an item without an active waiver', async () => {
    item.status = CaseChecklistItemStatus.Pending
    item.waiver = undefined
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(items.replace).not.toHaveBeenCalled()
  })
})
