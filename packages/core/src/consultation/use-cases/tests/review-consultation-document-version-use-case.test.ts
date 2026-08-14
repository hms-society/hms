import { DocumentVersionFaker } from '../../../document-production/domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { ReviewConsultationDocumentVersionUseCase } from '../review-consultation-document-version-use-case'

describe('Review Consultation Document Version Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ReviewConsultationDocumentVersionUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new ReviewConsultationDocumentVersionUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      datetimeProvider,
    )
  })

  it('allows an administrator to review any consultation document version', async () => {
    const consultation = ConsultationFaker.fake()
    const version = DocumentVersionFaker.fake()
    const reviewedAt = new Date('2026-08-12T19:00:00.000Z')
    const approved = { ...version, status: 'approved' as const, reviewedAt }
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentPackagesRepository.findByContext.mockResolvedValue({
      id: '11c8ee44-962c-4975-a1f4-fb0f28cdf889',
      context: { type: 'consultation', consultationId: consultation.id },
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      {
        id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
        documentPackageId: '11c8ee44-962c-4975-a1f4-fb0f28cdf889',
        documentId: version.documentId,
        documentSpecificationId: 'f7471138-f86c-49db-952e-5e21dd65d3fd',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    versionsRepository.findById.mockResolvedValue(version)
    versionsRepository.review.mockResolvedValue(approved)
    datetimeProvider.now.mockReturnValue(reviewedAt)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId: version.documentId,
        documentVersionId: version.id,
        reviewedByCollaboratorId: 'admin-collaborator-id',
        reviewedByCollaboratorProfile: 'admin',
        decision: 'approved',
      }),
    ).resolves.toEqual(approved)
    expect(versionsRepository.review).toHaveBeenCalledWith(
      version.id,
      'approved',
      'admin-collaborator-id',
      reviewedAt,
      undefined,
    )
  })
})
