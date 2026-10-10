import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { CaseMembersRepository } from '../../../case-management/interfaces'
import { DocumentVersionFaker } from '../../domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../interfaces'
import { SubmitDocumentVersionForReviewUseCase } from '../submit-document-version-for-review-use-case'

describe('Submit Document Version For Review Use Case', () => {
  const caseId = 'case-id'
  const documentId = 'document-id'
  const collaboratorId = 'collaborator-id'
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let packagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let caseMembersRepository: MockProxy<CaseMembersRepository>
  let useCase: SubmitDocumentVersionForReviewUseCase

  beforeEach(() => {
    versionsRepository = mock<DocumentVersionsRepository>()
    packagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    caseMembersRepository = mock<CaseMembersRepository>()
    useCase = new SubmitDocumentVersionForReviewUseCase(
      versionsRepository,
      packagesRepository,
      packageDocumentsRepository,
      caseMembersRepository,
    )
  })

  it('submits a version only for an active member of its case', async () => {
    const version = DocumentVersionFaker.fake({
      documentId,
      createdByCollaboratorId: collaboratorId,
      status: 'draft',
    })
    versionsRepository.findById.mockResolvedValue(version)
    versionsRepository.submitForReview.mockResolvedValue({
      ...version,
      status: 'in_review',
    })
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    packagesRepository.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      { documentId },
    ] as never)

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: version.id,
        collaboratorId,
      }),
    ).resolves.toMatchObject({ status: 'in_review' })

    expect(caseMembersRepository.findActiveCollaboratorIdsByCaseId).toHaveBeenCalledWith(
      caseId,
      [collaboratorId],
    )
  })

  it('rejects submitting when the collaborator is no longer an active case member', async () => {
    const version = DocumentVersionFaker.fake({
      documentId,
      createdByCollaboratorId: collaboratorId,
      status: 'draft',
    })
    versionsRepository.findById.mockResolvedValue(version)
    versionsRepository.submitForReview.mockResolvedValue({
      ...version,
      status: 'in_review',
    })
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: version.id,
        collaboratorId,
      }),
    ).rejects.toThrow()

    expect(versionsRepository.submitForReview).not.toHaveBeenCalled()
  })

  it('rejects submitting a version outside the requested case document', async () => {
    const version = DocumentVersionFaker.fake({
      documentId: 'another-document-id',
      createdByCollaboratorId: collaboratorId,
      status: 'draft',
    })
    versionsRepository.findById.mockResolvedValue(version)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    packagesRepository.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      { documentId },
    ] as never)

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: version.id,
        collaboratorId,
      }),
    ).rejects.toThrow()

    expect(versionsRepository.submitForReview).not.toHaveBeenCalled()
  })

  it('rejects submitting a document that is not in the requested case package', async () => {
    const version = DocumentVersionFaker.fake({
      documentId,
      createdByCollaboratorId: collaboratorId,
      status: 'draft',
    })
    versionsRepository.findById.mockResolvedValue(version)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    packagesRepository.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      { documentId: 'another-document-id' },
    ] as never)

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: version.id,
        collaboratorId,
      }),
    ).rejects.toThrow()

    expect(versionsRepository.submitForReview).not.toHaveBeenCalled()
  })
})
