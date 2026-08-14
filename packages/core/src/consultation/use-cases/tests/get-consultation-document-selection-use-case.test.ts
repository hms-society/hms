import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentPackageFaker } from '../../../document-production/domain/entities/fakers'
import { PackageDocumentFaker } from '../../../document-production/domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { DocumentSpecificationListRecord } from '../../../document-production/domain/structures'
import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { GetConsultationDocumentSelectionUseCase } from '../get-consultation-document-selection-use-case'

describe('Get Consultation Document Selection Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentSpecificationsRepository: MockProxy<DocumentSpecificationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentVersionsRepository: MockProxy<DocumentVersionsRepository>
  let useCase: GetConsultationDocumentSelectionUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentSpecificationsRepository = mock<DocumentSpecificationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentVersionsRepository = mock<DocumentVersionsRepository>()
    useCase = new GetConsultationDocumentSelectionUseCase(
      consultationsRepository,
      documentSpecificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentVersionsRepository,
    )
  })

  it('marks only package documents with versions as locked', async () => {
    const consultation = ConsultationFaker.fake()
    const firstSpecification = createSpecification('spec-versioned', 'Versionado')
    const secondSpecification = createSpecification('spec-editable', 'Sem versão')
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'consultation', consultationId: consultation.id },
    })
    const versionedPackageDocument = PackageDocumentFaker.fake({
      documentPackageId: documentPackage.id,
      documentId: 'document-versioned',
      documentSpecificationId: firstSpecification.documentSpecificationId,
    })
    const editablePackageDocument = PackageDocumentFaker.fake({
      documentPackageId: documentPackage.id,
      documentId: 'document-editable',
      documentSpecificationId: secondSpecification.documentSpecificationId,
    })
    const page = createPage([firstSpecification, secondSpecification])
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentSpecificationsRepository.list.mockResolvedValue(page)
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      versionedPackageDocument,
      editablePackageDocument,
    ])
    documentVersionsRepository.findByDocumentIds.mockResolvedValue([
      { documentId: versionedPackageDocument.documentId } as never,
    ])

    const result = await useCase.execute({
      consultationId: consultation.id,
      collaboratorId: 'collaborator-id',
      collaboratorProfile: CollaboratorProfile.Admin,
    })

    expect(result.options).toEqual([
      expect.objectContaining({
        documentSpecificationId: firstSpecification.documentSpecificationId,
        selected: true,
        hasVersion: true,
      }),
      expect.objectContaining({
        documentSpecificationId: secondSpecification.documentSpecificationId,
        selected: true,
        hasVersion: false,
      }),
    ])
    expect(documentVersionsRepository.findByDocumentIds).toHaveBeenCalledWith([
      versionedPackageDocument.documentId,
      editablePackageDocument.documentId,
    ])
  })
})

function createSpecification(
  documentSpecificationId: string,
  name: string,
): DocumentSpecificationListRecord {
  return {
    documentSpecificationId,
    name,
    description: `${name} description`,
    application: { scope: 'global', moment: 'consultation' },
    isRequired: false,
    status: 'available',
  }
}

function createPage(
  items: readonly DocumentSpecificationListRecord[],
): PaginationResponse<DocumentSpecificationListRecord> {
  return new PaginationResponse(items, 1, 100, items.length, 1)
}
