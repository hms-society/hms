import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { IdProvider } from '#shared/interfaces'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import {
  DocumentPackageFaker,
  PackageDocumentFaker,
} from '../../../document-production/domain/entities/fakers'
import type { DocumentSpecificationListRecord } from '../../../document-production/domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { ConsultationFaker } from '../../domain/entities/fakers'
import { ConsultationDocumentSelectionRemovalError } from '../../domain/errors'
import type { ConsultationsRepository } from '../../interfaces'
import { ReplaceConsultationDocumentSelectionUseCase } from '../replace-consultation-document-selection-use-case'

describe('Replace Consultation Document Selection Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentSpecificationsRepository: MockProxy<DocumentSpecificationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentsRepository: MockProxy<DocumentsRepository>
  let documentVersionsRepository: MockProxy<DocumentVersionsRepository>
  let idProvider: MockProxy<IdProvider>
  let useCase: ReplaceConsultationDocumentSelectionUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentSpecificationsRepository = mock<DocumentSpecificationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentsRepository = mock<DocumentsRepository>()
    documentVersionsRepository = mock<DocumentVersionsRepository>()
    idProvider = mock<IdProvider>()
    useCase = new ReplaceConsultationDocumentSelectionUseCase(
      consultationsRepository,
      documentSpecificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      documentVersionsRepository,
      idProvider,
    )
  })

  it('allows removing a package document without versions', async () => {
    const consultation = ConsultationFaker.fake()
    const specification = createSpecification('spec-editable', 'Sem versão')
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'consultation', consultationId: consultation.id },
    })
    const packageDocument = PackageDocumentFaker.fake({
      documentPackageId: documentPackage.id,
      documentSpecificationId: specification.documentSpecificationId,
      documentId: 'document-editable',
    })
    configureExistingPackage(
      consultationsRepository,
      documentSpecificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      consultation,
      documentPackage,
      [packageDocument],
      [specification],
    )
    documentVersionsRepository.findByDocumentIds.mockResolvedValue([])

    await expect(useCase.execute(createRequest(consultation.id, []))).resolves.toEqual(
      expect.objectContaining({
        selectedDocumentSpecificationIds: [],
        options: [expect.objectContaining({ selected: false, hasVersion: false })],
      }),
    )
    expect(packageDocumentsRepository.replaceForDocumentPackage).toHaveBeenCalledWith(
      documentPackage.id,
      [],
    )
  })

  it('rejects removing a package document with a version', async () => {
    const consultation = ConsultationFaker.fake()
    const specification = createSpecification('spec-versioned', 'Versionado')
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'consultation', consultationId: consultation.id },
    })
    const packageDocument = PackageDocumentFaker.fake({
      documentPackageId: documentPackage.id,
      documentSpecificationId: specification.documentSpecificationId,
      documentId: 'document-versioned',
    })
    configureExistingPackage(
      consultationsRepository,
      documentSpecificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      consultation,
      documentPackage,
      [packageDocument],
      [specification],
    )
    documentVersionsRepository.findByDocumentIds.mockResolvedValue([
      { documentId: packageDocument.documentId } as never,
    ])

    await expect(
      useCase.execute(createRequest(consultation.id, [])),
    ).rejects.toBeInstanceOf(ConsultationDocumentSelectionRemovalError)
    expect(packageDocumentsRepository.replaceForDocumentPackage).not.toHaveBeenCalled()
  })
})

function createRequest(consultationId: string, documentSpecificationIds: string[]) {
  return {
    consultationId,
    collaboratorId: 'collaborator-id',
    collaboratorProfile: CollaboratorProfile.Admin,
    documentSpecificationIds,
  } as const
}

function createSpecification(
  documentSpecificationId: string,
  name: string,
): DocumentSpecificationListRecord {
  return {
    documentSpecificationId,
    name,
    description: `${name} description`,
    application: { scope: 'global', moment: 'consultation' },
    status: 'available',
    accessClassification: 'Interno',
  }
}

function configureExistingPackage(
  consultationsRepository: MockProxy<ConsultationsRepository>,
  documentSpecificationsRepository: MockProxy<DocumentSpecificationsRepository>,
  documentPackagesRepository: MockProxy<DocumentPackagesRepository>,
  packageDocumentsRepository: MockProxy<PackageDocumentsRepository>,
  consultation: ReturnType<typeof ConsultationFaker.fake>,
  documentPackage: ReturnType<typeof DocumentPackageFaker.fake>,
  packageDocuments: readonly ReturnType<typeof PackageDocumentFaker.fake>[],
  specifications: readonly DocumentSpecificationListRecord[],
) {
  consultationsRepository.findById.mockResolvedValue(consultation)
  documentSpecificationsRepository.list.mockResolvedValue(
    new PaginationResponse(specifications, 1, 100, specifications.length, 1),
  )
  documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
  packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue(packageDocuments)
}
