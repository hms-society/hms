import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseAccessIntent } from '../../../case-management/domain/structures/case-access-intent'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import { DocumentValidationDocumentFaker } from '#document-engine/domain/entities/fakers'
import { DocumentFileNotFoundError } from '#document-engine/domain/errors'
import { DocumentValidationLogAction } from '#document-engine/domain/structures'
import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '#document-engine/interfaces'
import { ForbiddenError } from '#shared/domain/errors'
import { ListDocumentValidationLogsUseCase } from '../list-document-validation-logs-use-case'

describe('List Document Validation Logs Use Case', () => {
  let logs: MockProxy<DocumentValidationLogsRepository>
  let validations: MockProxy<DocumentValidationsRepository>
  let access: MockProxy<CaseAccessProvider>
  let useCase: ListDocumentValidationLogsUseCase

  beforeEach(() => {
    logs = mock<DocumentValidationLogsRepository>()
    validations = mock<DocumentValidationsRepository>()
    access = mock<CaseAccessProvider>()
    useCase = new ListDocumentValidationLogsUseCase(logs, validations, access)
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: 'file-1',
        checklistLink: { caseId: 'case-current' },
      }),
    )
  })

  it('returns complete logs only after authorizing the persisted owner', async () => {
    const records = [
      {
        id: 'log-1',
        documentFileId: 'file-1',
        action: DocumentValidationLogAction.DecisionRecorded,
        reason: 'Private reason',
        message: 'Private message',
        metadata: { context: 'private' },
        createdAt: new Date('2026-10-01T00:00:00.000Z'),
      },
    ]
    logs.listByDocumentFileId.mockResolvedValue(records)

    expect(
      await useCase.execute({ documentFileId: 'file-1', actorId: 'actor-1' }),
    ).toEqual(records)
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId: 'case-current',
      actorId: 'actor-1',
      intent: CaseAccessIntent.ReadContent,
    })
    expect(logs.listByDocumentFileId).toHaveBeenCalledExactlyOnceWith('file-1')
    expect(access.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      logs.listByDocumentFileId.mock.invocationCallOrder[0],
    )
  })

  it.each([
    'removed member',
    'another Case',
    'inactive actor',
  ])('does not load sensitive logs for a denied %s', async () => {
    const error = new ForbiddenError('Acesso negado.')
    access.authorize.mockRejectedValue(error)

    await expect(
      useCase.execute({ documentFileId: 'file-1', actorId: 'actor-1' }),
    ).rejects.toBe(error)
    expect(logs.listByDocumentFileId).not.toHaveBeenCalled()
  })

  it('preserves independent access when no Case owns the document', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({ checklistLink: undefined }),
    )
    logs.listByDocumentFileId.mockResolvedValue([])

    expect(
      await useCase.execute({ documentFileId: 'file-1', actorId: 'actor-1' }),
    ).toEqual([])
    expect(access.authorize).not.toHaveBeenCalled()
    expect(logs.listByDocumentFileId).toHaveBeenCalledWith('file-1')
  })

  it('rejects a missing document before accessing logs', async () => {
    validations.findByFileId.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ documentFileId: 'missing', actorId: 'actor-1' }),
    ).rejects.toBeInstanceOf(DocumentFileNotFoundError)
    expect(access.authorize).not.toHaveBeenCalled()
    expect(logs.listByDocumentFileId).not.toHaveBeenCalled()
  })
})
