import {
  DocumentFaker,
  DocumentVersionFaker,
} from '../../../document-production/domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { SelectCurrentConsultationDocumentVersionUseCase } from '../select-current-consultation-document-version-use-case'

describe('Select Current Consultation Document Version Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentsRepository: MockProxy<DocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let useCase: SelectCurrentConsultationDocumentVersionUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentsRepository = mock<DocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    useCase = new SelectCurrentConsultationDocumentVersionUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
    )
  })

  it('allows an administrator to select a current version in any consultation', async () => {
    const consultation = ConsultationFaker.fake()
    const version = DocumentVersionFaker.fake({ status: 'approved' })
    const document = DocumentFaker.fake({
      id: version.documentId,
      currentVersionId: version.id,
    })
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
        documentId: document.id,
        documentSpecificationId: 'f7471138-f86c-49db-952e-5e21dd65d3fd',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    versionsRepository.findById.mockResolvedValue(version)
    documentsRepository.replace.mockResolvedValue(document)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId: document.id,
        documentVersionId: version.id,
        selectedByCollaboratorId: 'admin-collaborator-id',
        selectedByCollaboratorProfile: 'admin',
      }),
    ).resolves.toEqual(document)
    expect(documentsRepository.replace).toHaveBeenCalledWith(document.id, {
      currentVersionId: version.id,
    })
  })
})
