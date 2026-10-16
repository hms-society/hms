import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DatetimeProvider } from '#shared/interfaces'
import { BadRequestError, ConflictError, ForbiddenError } from '#shared/domain/errors'
import { CaseChecklistItemFaker } from '../../domain/entities/fakers'
import {
  CaseAccessIntent,
  CaseChecklistItemStatus,
  CaseHistoryCategory,
  CaseHistoryKind,
} from '../../domain/structures'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  CaseCollaboratorsProvider,
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
} from '../../interfaces'
import { AddCaseChecklistComplementaryItemUseCase } from '../add-case-checklist-complementary-item-use-case'

describe('Add Case Checklist Complementary Item Use Case', () => {
  let items: MockProxy<CaseChecklistItemsRepository>
  let access: MockProxy<CaseAccessProvider>
  let histories: MockProxy<CaseHistoriesRepository>
  let transaction: MockProxy<CaseHistoryTransactionProvider>
  let collaborators: MockProxy<CaseCollaboratorsProvider>
  let datetime: MockProxy<DatetimeProvider>
  let useCase: AddCaseChecklistComplementaryItemUseCase
  let request: Parameters<AddCaseChecklistComplementaryItemUseCase['execute']>[0]
  const now = new Date('2026-10-13T12:00:00.000Z')

  beforeEach(() => {
    items = mock<CaseChecklistItemsRepository>()
    access = mock<CaseAccessProvider>()
    histories = mock<CaseHistoriesRepository>()
    transaction = mock<CaseHistoryTransactionProvider>()
    collaborators = mock<CaseCollaboratorsProvider>()
    datetime = mock<DatetimeProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    datetime.now.mockReturnValue(now)
    items.listByCaseId.mockResolvedValue([])
    items.addMany.mockImplementation(async ([item]) => [
      CaseChecklistItemFaker.fake({ ...item, status: CaseChecklistItemStatus.Pending }),
    ])
    request = {
      caseId: faker.string.uuid(),
      collaboratorId: faker.string.uuid(),
      templateItemKey: faker.string.uuid(),
      title: '  Prova complementar  ',
    }
    useCase = new AddCaseChecklistComplementaryItemUseCase(
      items,
      access,
      histories,
      transaction,
      collaborators,
      datetime,
    )
  })

  it('adds a normalized required pending item and authoritative immutable audit in the transaction', async () => {
    collaborators.findById.mockResolvedValue({
      collaboratorId: request.collaboratorId,
      professionalName: 'Dra. Ana',
      email: 'ana@example.com',
      profile: 'lawyer',
      status: 'active',
    })
    const result = await useCase.execute({
      ...request,
      templateItemKey: `  ${request.templateItemKey}  `,
    })
    expect(result).toMatchObject({
      title: 'Prova complementar',
      isRequired: true,
      status: CaseChecklistItemStatus.Pending,
    })
    expect(result.documentFileId).toBeUndefined()
    expect(result.validatedAt).toBeUndefined()
    expect(result.waiver).toBeUndefined()
    expect(transaction.runInTransaction).toHaveBeenCalledTimes(1)
    expect(access.authorize).toHaveBeenCalledWith({
      caseId: request.caseId,
      actorId: request.collaboratorId,
      intent: CaseAccessIntent.WriteContent,
    })
    expect(items.addMany).toHaveBeenCalledWith([
      {
        caseId: request.caseId,
        templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
        title: 'Prova complementar',
        isRequired: true,
      },
    ])
    expect(histories.add).toHaveBeenCalledWith({
      caseId: request.caseId,
      kind: CaseHistoryKind.ChecklistItemAdded,
      category: CaseHistoryCategory.Documents,
      occurredAt: now,
      recordedAt: now,
      actorId: request.collaboratorId,
      actorName: 'Dra. Ana',
      title: 'Item adicionado ao checklist',
      description: 'Prova complementar',
      documents: [],
      details: {
        checklistItemId: result.id,
        title: 'Prova complementar',
        isRequired: true,
      },
      sourceKey: `checklist-item-added:${result.id}`,
    })
  })

  it.each([
    true,
    false,
  ])('persists explicit required=%s in the item and immutable history', async (isRequired) => {
    const result = await useCase.execute({ ...request, isRequired })
    expect(result).toMatchObject({ isRequired, status: CaseChecklistItemStatus.Pending })
    expect(items.addMany).toHaveBeenCalledWith([expect.objectContaining({ isRequired })])
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({
        details: { checklistItemId: result.id, title: 'Prova complementar', isRequired },
      }),
    )
  })

  it.each([
    true,
    false,
  ])('replays required=%s without another item or history', async (isRequired) => {
    const previous = CaseChecklistItemFaker.fake({
      templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
      title: 'Prova complementar',
      isRequired,
    })
    items.listByCaseId.mockResolvedValue([previous])
    expect(await useCase.execute({ ...request, isRequired })).toBe(previous)
    expect(items.addMany).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })

  it.each([
    true,
    false,
  ])('rejects changing required=%s for the same key', async (isRequired) => {
    items.listByCaseId.mockResolvedValue([
      CaseChecklistItemFaker.fake({
        templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
        title: 'Prova complementar',
        isRequired,
      }),
    ])
    await expect(
      useCase.execute({ ...request, isRequired: !isRequired }),
    ).rejects.toThrow(ConflictError)
    expect(items.addMany).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })

  it.each([
    true,
    false,
  ])('rejects an insertion race with changed required=%s', async (isRequired) => {
    items.listByCaseId.mockResolvedValueOnce([]).mockResolvedValueOnce([
      CaseChecklistItemFaker.fake({
        templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
        title: 'Prova complementar',
        isRequired,
      }),
    ])
    items.addMany.mockResolvedValue([])
    await expect(
      useCase.execute({ ...request, isRequired: !isRequired }),
    ).rejects.toThrow(ConflictError)
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('replays an optional insertion race with no duplicate audit', async () => {
    const previous = CaseChecklistItemFaker.fake({
      templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
      title: 'Prova complementar',
      isRequired: false,
    })
    items.listByCaseId.mockResolvedValueOnce([]).mockResolvedValueOnce([previous])
    items.addMany.mockResolvedValue([])
    expect(await useCase.execute({ ...request, isRequired: false })).toBe(previous)
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('records trusted actor identity even if display name is unavailable', async () => {
    collaborators.findById.mockResolvedValue(undefined)
    await useCase.execute(request)
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: request.collaboratorId, actorName: undefined }),
    )
  })

  it.each([
    { title: '' },
    { title: '  ' },
    { templateItemKey: '' },
    { templateItemKey: '  ' },
  ])('rejects blank name or operation key %j without a write', async (invalid) => {
    await expect(useCase.execute({ ...request, ...invalid })).rejects.toThrow(
      BadRequestError,
    )
    expect(items.addMany).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('accepts a single character name without an invented minimum', async () => {
    expect((await useCase.execute({ ...request, title: ' A ' })).title).toBe('A')
  })

  it('replays the same actor key and normalized title without another item or audit', async () => {
    const previous = CaseChecklistItemFaker.fake({
      caseId: request.caseId,
      templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
      title: 'Prova complementar',
    })
    items.listByCaseId.mockResolvedValue([previous])
    expect(await useCase.execute(request)).toBe(previous)
    expect(access.authorize).toHaveBeenCalledTimes(1)
    expect(items.addMany).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('rejects reuse of the key for a different normalized name', async () => {
    items.listByCaseId.mockResolvedValue([
      CaseChecklistItemFaker.fake({
        templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
        title: 'Outro documento',
      }),
    ])
    await expect(useCase.execute(request)).rejects.toThrow(ConflictError)
    expect(items.addMany).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('keeps the same client key independent between actors', async () => {
    items.listByCaseId.mockResolvedValue([
      CaseChecklistItemFaker.fake({
        templateItemKey: `manual-item:${faker.string.uuid()}:${request.templateItemKey}`,
        title: 'Outro documento',
      }),
    ])
    await useCase.execute(request)
    expect(items.addMany).toHaveBeenCalledTimes(1)
    expect(histories.add).toHaveBeenCalledTimes(1)
  })

  it('re-resolves an insertion race as replay without duplicate history', async () => {
    const previous = CaseChecklistItemFaker.fake({
      templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
      title: 'Prova complementar',
    })
    items.listByCaseId.mockResolvedValueOnce([]).mockResolvedValueOnce([previous])
    items.addMany.mockResolvedValue([])
    expect(await useCase.execute(request)).toBe(previous)
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('returns conflict when an insertion race used a different name', async () => {
    items.listByCaseId.mockResolvedValueOnce([]).mockResolvedValueOnce([
      CaseChecklistItemFaker.fake({
        templateItemKey: `manual-item:${request.collaboratorId}:${request.templateItemKey}`,
        title: 'Outro documento',
      }),
    ])
    items.addMany.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow(ConflictError)
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('reports unresolved insertion as retryable conflict instead of missing case', async () => {
    items.addMany.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow(ConflictError)
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('does not replay or write when current access denies the actor', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(useCase.execute(request)).rejects.toThrow(ForbiddenError)
    expect(items.listByCaseId).not.toHaveBeenCalled()
    expect(items.addMany).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })

  it('propagates append failure through the atomic transaction boundary', async () => {
    histories.add.mockRejectedValue(new ConflictError('Audit failed'))
    await expect(useCase.execute(request)).rejects.toThrow('Audit failed')
    expect(transaction.runInTransaction).toHaveBeenCalledTimes(1)
    expect(items.addMany).toHaveBeenCalledTimes(1)
  })
})
