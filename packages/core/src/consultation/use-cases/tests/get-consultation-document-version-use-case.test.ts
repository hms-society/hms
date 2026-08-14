import { DocumentVersionFaker } from '../../../document-production/domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { GetConsultationDocumentVersionUseCase } from '../get-consultation-document-version-use-case'

describe('Get Consultation Document Version Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let useCase: GetConsultationDocumentVersionUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    useCase = new GetConsultationDocumentVersionUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
    )
  })

  it('returns a version belonging to the consultation document', async () => {
    const consultation = ConsultationFaker.fake()
    const version = DocumentVersionFaker.fake()
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

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId: version.documentId,
        documentVersionId: version.id,
        collaboratorId: consultation.assignedLawyerId,
      }),
    ).resolves.toEqual(version)
  })
})
