import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  CaseAccessProvider,
  CaseHistoriesRepository,
  CaseCollaboratorsProvider,
} from '../../interfaces'
import { BadRequestError, ForbiddenError } from '#shared/domain/errors'
import { CaseHistoryEntryFaker } from '../../domain/entities/fakers'
import { CaseAccessIntent, CaseHistoryCategory } from '../../domain/structures'
import { ListCaseHistoryUseCase } from '../list-case-history-use-case'

describe('List Case History Use Case', () => {
  const access = mock<CaseAccessProvider>()
  const histories = mock<CaseHistoriesRepository>()
  const collaborators = mock<CaseCollaboratorsProvider>()
  let useCase: ListCaseHistoryUseCase
  beforeEach(() => {
    access.authorize.mockReset()
    histories.listByCaseId.mockReset()
    collaborators.findByIds.mockResolvedValue([])
    useCase = new ListCaseHistoryUseCase(access, histories, collaborators)
  })
  it('authorizes first and requests globally filtered limit+1', async () => {
    const entry = CaseHistoryEntryFaker.fake()
    histories.listByCaseId.mockResolvedValue([entry])
    const result = await useCase.execute({
      caseId: entry.caseId,
      actorId: 'actor',
      category: CaseHistoryCategory.Manual,
      search: '  100%_  ',
    })
    expect(result.items[0]).toEqual(entry)
    expect(result.nextCursor).toBeUndefined()
    expect(access.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ intent: CaseAccessIntent.ReadContent }),
    )
    expect(histories.listByCaseId).toHaveBeenCalledWith({
      caseId: entry.caseId,
      category: CaseHistoryCategory.Manual,
      search: '100%_',
      before: undefined,
      limit: 21,
    })
  })
  it('round trips the equal-time boundary and refuses changed context', async () => {
    const entries = CaseHistoryEntryFaker.fakeMany(2)
    histories.listByCaseId.mockResolvedValue(entries)
    const request = {
      caseId: entries[0]?.caseId,
      actorId: 'actor',
      limit: 1,
      search: 'test',
    }
    const page = await useCase.execute(request)
    expect(page.nextCursor).toBeDefined()
    histories.listByCaseId.mockResolvedValue([])
    await useCase.execute({ ...request, cursor: page.nextCursor })
    expect(histories.listByCaseId).toHaveBeenLastCalledWith(
      expect.objectContaining({
        before: { id: entries[0]?.id, occurredAt: entries[0]?.occurredAt },
      }),
    )
    await expect(
      useCase.execute({ ...request, caseId: 'other', cursor: page.nextCursor }),
    ).rejects.toThrow(BadRequestError)
    await expect(
      useCase.execute({ ...request, search: 'changed', cursor: page.nextCursor }),
    ).rejects.toThrow(BadRequestError)
  })
  it.each([
    '%',
    'null',
    '[]',
    '{}',
    'x'.repeat(2049),
  ])('rejects malformed cursor %s', async (cursor) => {
    await expect(
      useCase.execute({ caseId: 'case', actorId: 'actor', cursor }),
    ).rejects.toThrow(BadRequestError)
  })
  it.each([0, 51, 1.5])('rejects invalid limit %s', async (limit) => {
    await expect(
      useCase.execute({ caseId: 'case', actorId: 'actor', limit }),
    ).rejects.toThrow(BadRequestError)
  })
  it('never queries denied content', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(useCase.execute({ caseId: 'case', actorId: 'actor' })).rejects.toThrow(
      ForbiddenError,
    )
    expect(histories.listByCaseId).not.toHaveBeenCalled()
  })
  it('round trips maximum multibyte search within cursor limit', async () => {
    const rows = CaseHistoryEntryFaker.fakeMany(2)
    histories.listByCaseId.mockResolvedValue(rows)
    const request = {
      caseId: rows[0]?.caseId,
      actorId: 'actor',
      search: '文'.repeat(200),
      limit: 1,
    }
    const result = await useCase.execute(request)
    expect(result.nextCursor?.length).toBeLessThanOrEqual(2048)
    histories.listByCaseId.mockResolvedValue([])
    await expect(
      useCase.execute({ ...request, cursor: result.nextCursor }),
    ).resolves.toEqual({ items: [], nextCursor: undefined })
  })
})
