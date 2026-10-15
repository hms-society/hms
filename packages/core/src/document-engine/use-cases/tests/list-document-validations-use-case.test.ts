import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseAccessIntent } from '../../../case-management/domain/structures/case-access-intent'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '../../../case-management/interfaces'
import { DocumentValidationDocumentFaker } from '#document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '#document-engine/domain/structures'
import type { DocumentValidationsRepository } from '#document-engine/interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import { AppError, ForbiddenError } from '#shared/domain/errors'
import { ListDocumentValidationsUseCase } from '../list-document-validations-use-case'

describe('List Document Validations Use Case', () => {
  let validations: MockProxy<DocumentValidationsRepository>
  let access: MockProxy<CaseAccessProvider>
  let cases: MockProxy<LegalCasesRepository>
  let checklist: MockProxy<CaseChecklistItemsRepository>
  let useCase: ListDocumentValidationsUseCase

  beforeEach(() => {
    validations = mock<DocumentValidationsRepository>()
    access = mock<CaseAccessProvider>()
    cases = mock<LegalCasesRepository>()
    checklist = mock<CaseChecklistItemsRepository>()
    checklist.listByCaseId.mockResolvedValue([])
    useCase = new ListDocumentValidationsUseCase(
      validations,
      access,
      cases,
      checklist,
      mock<CollaboratorsRepository>(),
      mock<UsersRepository>(),
    )
  })

  it('authorizes a requested Case before querying and preserves filters', async () => {
    validations.list.mockResolvedValue([])
    expect(
      await useCase.execute({
        caseId: 'case-1',
        actorId: 'actor-1',
        status: DocumentValidationStatus.AwaitingValidation,
      }),
    ).toEqual([])
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId: 'case-1',
      actorId: 'actor-1',
      intent: CaseAccessIntent.ReadDocument,
    })
    expect(validations.list).toHaveBeenCalledExactlyOnceWith({
      caseId: 'case-1',
      status: DocumentValidationStatus.AwaitingValidation,
    })
    expect(access.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      validations.list.mock.invocationCallOrder[0],
    )
  })

  it('rejects a forbidden requested Case before querying records', async () => {
    const error = new ForbiddenError('Acesso negado.')
    access.authorize.mockRejectedValue(error)
    await expect(useCase.execute({ caseId: 'case-1', actorId: 'actor-1' })).rejects.toBe(
      error,
    )
    expect(validations.list).not.toHaveBeenCalled()
  })

  it('filters the complete array by current owners while retaining independent records', async () => {
    const records = [
      DocumentValidationDocumentFaker.fake({
        id: 'allowed',
        checklistLink: { caseId: 'case-b' },
      }),
      DocumentValidationDocumentFaker.fake({
        id: 'denied',
        checklistLink: { caseId: 'case-a' },
      }),
      DocumentValidationDocumentFaker.fake({
        id: 'independent',
        checklistLink: undefined,
      }),
      DocumentValidationDocumentFaker.fake({
        id: 'also-allowed',
        checklistLink: { caseId: 'case-c' },
      }),
    ]
    validations.list.mockResolvedValue(records)
    validations.findByFileId.mockImplementation(async (id) =>
      records.find((record) => record.id === id),
    )
    access.authorize.mockImplementation(async ({ caseId }) => {
      if (caseId === 'case-a') throw new ForbiddenError('Acesso negado.')
    })

    const result = await useCase.execute({ actorId: 'actor-1' })
    expect(result.map((record) => record.id)).toEqual([
      'allowed',
      'independent',
      'also-allowed',
    ])
    expect(access.authorize).toHaveBeenCalledTimes(3)
    expect(cases.findById).not.toHaveBeenCalledWith('case-a')
    expect(checklist.listByCaseId).not.toHaveBeenCalledWith('case-a')
  })

  it('redacts forbidden duplicate and AI context without dropping an accessible record', async () => {
    const accessible = DocumentValidationDocumentFaker.fake({
      id: 'allowed',
      checklistLink: { caseId: 'case-b' },
      duplicateMatch: {
        documentFileId: 'private-file',
        fileName: 'private.pdf',
        receivedAt: new Date('2026-10-01T00:00:00.000Z'),
      },
      aiSuggestion: {
        caseId: 'case-a',
        storagePath: 'private/path',
        context: 'private context',
      },
    })
    const privateRecord = DocumentValidationDocumentFaker.fake({
      id: 'private-file',
      checklistLink: { caseId: 'case-a' },
    })
    validations.list.mockResolvedValue([accessible])
    validations.findByFileId.mockImplementation(async (id) =>
      id === accessible.id ? accessible : privateRecord,
    )
    access.authorize.mockImplementation(async ({ caseId }) => {
      if (caseId === 'case-a') throw new ForbiddenError('Acesso negado.')
    })

    const result = await useCase.execute({ actorId: 'actor-1' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(accessible.id)
    expect(result[0].duplicateMatch).toBeUndefined()
    expect(result[0].aiSuggestion).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain('private')
    expect(cases.findById).not.toHaveBeenCalledWith('case-a')
  })

  it('propagates non-authorization failures instead of silently hiding them', async () => {
    const record = DocumentValidationDocumentFaker.fake({
      checklistLink: { caseId: 'case-1' },
    })
    validations.list.mockResolvedValue([record])
    validations.findByFileId.mockResolvedValue(record)
    const error = new AppError('Provider unavailable', 'Service error')
    access.authorize.mockRejectedValue(error)
    await expect(useCase.execute({ actorId: 'actor-1' })).rejects.toBe(error)
  })
})
