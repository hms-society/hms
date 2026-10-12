import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import type { LegalCasesRepository } from '../../../case-management/interfaces/legal-cases-repository'
import type { CaseChecklistItemsRepository } from '../../../case-management/interfaces/case-checklist-items-repository'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '../../../identity/interfaces'
import type { DocumentValidationsRepository } from '../../interfaces'
import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { GetDocumentValidationUseCase } from '../get-document-validation-use-case'

describe('GetDocumentValidationUseCase', () => {
  let validations: MockProxy<DocumentValidationsRepository>
  let access: MockProxy<CaseAccessProvider>
  let cases: MockProxy<LegalCasesRepository>
  let checklist: MockProxy<CaseChecklistItemsRepository>
  let collaborators: MockProxy<CollaboratorsRepository>
  let users: MockProxy<UsersRepository>
  let useCase: GetDocumentValidationUseCase

  beforeEach(() => {
    validations = mock<DocumentValidationsRepository>()
    access = mock<CaseAccessProvider>()
    cases = mock<LegalCasesRepository>()
    checklist = mock<CaseChecklistItemsRepository>()
    collaborators = mock<CollaboratorsRepository>()
    users = mock<UsersRepository>()
    useCase = new GetDocumentValidationUseCase(
      validations,
      access,
      cases,
      checklist,
      collaborators,
      users,
    )
  })

  it('authorizes the persisted Case before composing its projection', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: 'file-1',
        reviewedBy: 'user-1',
        checklistLink: { caseId: 'case-1', checklistItemId: 'item-1' },
      }),
    )
    cases.findById.mockResolvedValue({ id: 'case-1', title: 'Case title' } as never)
    checklist.listByCaseId.mockResolvedValue([
      { id: 'item-1', title: 'Item title' },
    ] as never)

    const result = await useCase.execute({
      documentFileId: 'file-1',
      actorId: 'collaborator-1',
    })

    expect(access.authorize).toHaveBeenCalledWith({
      caseId: 'case-1',
      actorId: 'collaborator-1',
      intent: 'read_content',
    })
    expect(result.checklistLink).toEqual({
      caseId: 'case-1',
      caseLabel: 'Case title',
      checklistItemId: 'item-1',
      checklistItemLabel: 'Item title',
    })
    expect(cases.findById.mock.invocationCallOrder[0]).toBeGreaterThan(
      access.authorize.mock.invocationCallOrder[0],
    )
  })

  it('redacts a duplicate projection when its Case is forbidden', async () => {
    validations.findByFileId
      .mockResolvedValueOnce(
        DocumentValidationDocumentFaker.fake({
          id: 'file-1',
          checklistLink: { caseId: 'case-1' },
          duplicateMatch: {
            documentFileId: 'file-2',
            fileName: 'private.pdf',
            receivedAt: new Date(),
          },
          aiSuggestion: { caseId: 'case-2', context: 'private' },
        }),
      )
      .mockResolvedValueOnce(
        DocumentValidationDocumentFaker.fake({
          id: 'file-2',
          checklistLink: { caseId: 'case-2' },
        }),
      )
    checklist.listByCaseId.mockResolvedValue([])
    access.authorize.mockResolvedValueOnce()
    access.authorize.mockRejectedValueOnce(new ForbiddenError('forbidden'))

    const result = await useCase.execute({
      documentFileId: 'file-1',
      actorId: 'collaborator-1',
    })

    expect(result.duplicateMatch).toBeUndefined()
    expect(result.aiSuggestion).toBeUndefined()
  })

  it('redacts a duplicate suggestion whose referenced file no longer exists', async () => {
    validations.findByFileId
      .mockResolvedValueOnce(
        DocumentValidationDocumentFaker.fake({
          id: 'file-1',
          duplicateMatch: {
            documentFileId: 'missing-file',
            fileName: 'private.pdf',
            receivedAt: new Date(),
          },
          aiSuggestion: { caseId: 'case-2', context: 'private' },
        }),
      )
      .mockResolvedValueOnce(undefined)

    const result = await useCase.execute({
      documentFileId: 'file-1',
      actorId: 'collaborator-1',
    })

    expect(result.duplicateMatch).toBeUndefined()
    expect(result.aiSuggestion).toBeUndefined()
    expect(access.authorize).not.toHaveBeenCalled()
    expect(cases.findById).not.toHaveBeenCalled()
  })

  it('projects a permitted duplicate Case and resolves its checklist labels', async () => {
    const duplicateReceivedAt = new Date('2026-09-10T12:00:00.000Z')
    validations.findByFileId
      .mockResolvedValueOnce(
        DocumentValidationDocumentFaker.fake({
          id: 'file-1',
          reviewedBy: 'user-1',
          checklistLink: { caseId: 'case-1', checklistItemId: 'item-1' },
          duplicateMatch: {
            documentFileId: 'file-2',
            fileName: 'duplicate.pdf',
            receivedAt: duplicateReceivedAt,
            hashSha256: 'hash-2',
          },
          aiSuggestion: { caseId: 'case-2', documentTypeId: 'type-2' },
        }),
      )
      .mockResolvedValueOnce(
        DocumentValidationDocumentFaker.fake({
          id: 'file-2',
          fileName: 'duplicate.pdf',
          receivedAt: duplicateReceivedAt,
          checklistLink: { caseId: 'case-2', checklistItemId: 'item-2' },
        }),
      )
    cases.findById
      .mockResolvedValueOnce({ id: 'case-1', title: 'Primary case' } as never)
      .mockResolvedValueOnce({ id: 'case-2', title: 'Duplicate case' } as never)
    checklist.listByCaseId
      .mockResolvedValueOnce([{ id: 'item-1', title: 'Primary item' }] as never)
      .mockResolvedValueOnce([{ id: 'item-2', title: 'Duplicate item' }] as never)
    collaborators.findByUserId.mockResolvedValue({
      professionalName: 'Reviewer',
    } as never)

    const result = await useCase.execute({
      documentFileId: 'file-1',
      actorId: 'collaborator-1',
    })

    expect(access.authorize).toHaveBeenCalledTimes(3)
    expect(result.reviewedByName).toBe('Reviewer')
    expect(result.checklistLink).toEqual({
      caseId: 'case-1',
      caseLabel: 'Primary case',
      checklistItemId: 'item-1',
      checklistItemLabel: 'Primary item',
    })
    expect(result.duplicateMatch).toEqual({
      documentFileId: 'file-2',
      fileName: 'duplicate.pdf',
      receivedAt: duplicateReceivedAt,
      caseLabel: 'Duplicate case',
      checklistItemLabel: 'Duplicate item',
    })
  })
})
