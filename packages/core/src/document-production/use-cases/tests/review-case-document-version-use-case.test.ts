import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../../case-management/domain/entities/fakers'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '../../../case-management/interfaces'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import {
  DocumentFaker,
  DocumentVersionFaker,
} from '../../domain/entities/fakers'
import type {
  DocumentsRepository,
  DocumentVersionsRepository,
} from '../../interfaces'
import { ReviewCaseDocumentVersionUseCase } from '../review-case-document-version-use-case'

describe('Review Case Document Version Use Case', () => {
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let documentsRepository: MockProxy<DocumentsRepository>
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let caseMembersRepository: MockProxy<CaseMembersRepository>
  let useCase: ReviewCaseDocumentVersionUseCase

  beforeEach(() => {
    versionsRepository = mock<DocumentVersionsRepository>()
    documentsRepository = mock<DocumentsRepository>()
    legalCasesRepository = mock<LegalCasesRepository>()
    caseMembersRepository = mock<CaseMembersRepository>()
    useCase = new ReviewCaseDocumentVersionUseCase(
      versionsRepository,
      documentsRepository,
      legalCasesRepository,
      caseMembersRepository,
    )
  })

  it('sets the approved version as the current document version', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    const version = DocumentVersionFaker.fake({
      documentId: document.id,
      status: 'in_review',
      createdByCollaboratorId: 'author-id',
    })
    const reviewedVersion = { ...version, status: 'approved' as const }
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'reviewer-id',
    ])
    versionsRepository.findById.mockResolvedValue(version)
    versionsRepository.review.mockResolvedValue(reviewedVersion)
    documentsRepository.replace.mockResolvedValue({
      ...document,
      currentVersionId: version.id,
    })

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: document.id,
        documentVersionId: version.id,
        reviewedByCollaboratorId: 'reviewer-id',
        reviewedByCollaboratorProfile: CollaboratorProfile.Lawyer,
        decision: 'approved',
        reviewedAt: new Date('2026-10-16T20:00:00.000Z'),
      }),
    ).resolves.toBe(reviewedVersion)

    expect(documentsRepository.replace).toHaveBeenCalledWith(document.id, {
      currentVersionId: version.id,
    })
  })

  it('does not change the current version when the review rejects the version', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    const version = DocumentVersionFaker.fake({
      documentId: document.id,
      status: 'in_review',
      createdByCollaboratorId: 'author-id',
    })
    const reviewedVersion = { ...version, status: 'rejected' as const }
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'reviewer-id',
    ])
    versionsRepository.findById.mockResolvedValue(version)
    versionsRepository.review.mockResolvedValue(reviewedVersion)

    await useCase.execute({
      caseId: legalCase.id,
      documentId: document.id,
      documentVersionId: version.id,
      reviewedByCollaboratorId: 'reviewer-id',
      reviewedByCollaboratorProfile: CollaboratorProfile.Lawyer,
      decision: 'rejected',
      rejectionReason: 'Ajustar fundamentos.',
      reviewedAt: new Date('2026-10-16T20:00:00.000Z'),
    })

    expect(documentsRepository.replace).not.toHaveBeenCalled()
  })
})
