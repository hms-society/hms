import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  DocumentPackageFaker,
  DocumentVersionFaker,
} from '../../../document-production/domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { ConsultationFaker } from '../../domain/entities/fakers'
import { ConsultationPackageConfirmationError } from '../../domain/errors'
import type { ConsultationsRepository } from '../../interfaces'
import { ConfirmConsultationDocumentPackageUseCase } from '../confirm-consultation-document-package-use-case'

describe('Confirm Consultation Document Package Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentVersionsRepository: MockProxy<DocumentVersionsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ConfirmConsultationDocumentPackageUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentVersionsRepository = mock<DocumentVersionsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new ConfirmConsultationDocumentPackageUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentVersionsRepository,
      datetimeProvider,
    )
  })

  it('confirms a package when the latest versions are approved or rejected', async () => {
    const consultationId = '00000000-0000-4000-8000-000000000101'
    const collaboratorId = '00000000-0000-4000-8000-000000000102'
    const documentPackage = DocumentPackageFaker.fake({
      id: '00000000-0000-4000-8000-000000000103',
      context: { type: 'consultation', consultationId },
    })
    const packageDocuments = [
      {
        id: '00000000-0000-4000-8000-000000000104',
        documentPackageId: documentPackage.id,
        documentId: '00000000-0000-4000-8000-000000000105',
        documentSpecificationId: '00000000-0000-4000-8000-000000000106',
        createdAt: new Date('2026-08-21T12:00:00.000Z'),
        updatedAt: new Date('2026-08-21T12:00:00.000Z'),
      },
      {
        id: '00000000-0000-4000-8000-000000000107',
        documentPackageId: documentPackage.id,
        documentId: '00000000-0000-4000-8000-000000000108',
        documentSpecificationId: '00000000-0000-4000-8000-000000000109',
        createdAt: new Date('2026-08-21T12:00:00.000Z'),
        updatedAt: new Date('2026-08-21T12:00:00.000Z'),
      },
    ]
    const versions = [
      DocumentVersionFaker.fake({
        documentId: packageDocuments[0].documentId,
        versionNumber: 2,
        status: 'approved',
      }),
      DocumentVersionFaker.fake({
        documentId: packageDocuments[1].documentId,
        versionNumber: 1,
        status: 'rejected',
      }),
    ]
    const confirmedAt = new Date('2026-08-21T12:30:00.000Z')
    const confirmedPackage = {
      ...documentPackage,
      confirmedAt,
      confirmedByCollaboratorId: collaboratorId,
    }

    consultationsRepository.findById.mockResolvedValue(
      ConsultationFaker.fake({
        id: consultationId,
        assignedLawyerId: collaboratorId,
        attendanceFinalizedAt: new Date('2026-08-21T12:00:00.000Z'),
      }),
    )
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue(packageDocuments)
    documentVersionsRepository.findByDocumentIds.mockResolvedValue(versions)
    documentPackagesRepository.confirm.mockResolvedValue(confirmedPackage)
    datetimeProvider.now.mockReturnValue(confirmedAt)

    await expect(
      useCase.execute({
        consultationId,
        collaboratorId,
        collaboratorProfile: 'lawyer',
      }),
    ).resolves.toEqual(confirmedPackage)
    expect(documentPackagesRepository.confirm).toHaveBeenCalledWith(
      documentPackage.id,
      collaboratorId,
      confirmedAt,
    )
  })

  it('rejects a package when a document has no final version status', async () => {
    const consultationId = '00000000-0000-4000-8000-000000000201'
    const collaboratorId = '00000000-0000-4000-8000-000000000202'
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'consultation', consultationId },
    })
    const packageDocument = {
      id: '00000000-0000-4000-8000-000000000203',
      documentPackageId: documentPackage.id,
      documentId: '00000000-0000-4000-8000-000000000204',
      documentSpecificationId: '00000000-0000-4000-8000-000000000205',
      createdAt: new Date('2026-08-21T12:00:00.000Z'),
      updatedAt: new Date('2026-08-21T12:00:00.000Z'),
    }

    consultationsRepository.findById.mockResolvedValue(
      ConsultationFaker.fake({
        id: consultationId,
        assignedLawyerId: collaboratorId,
        attendanceFinalizedAt: new Date('2026-08-21T12:00:00.000Z'),
      }),
    )
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      packageDocument,
    ])
    documentVersionsRepository.findByDocumentIds.mockResolvedValue([
      DocumentVersionFaker.fake({
        documentId: packageDocument.documentId,
        status: 'in_review',
      }),
    ])

    await expect(
      useCase.execute({
        consultationId,
        collaboratorId,
        collaboratorProfile: 'lawyer',
      }),
    ).rejects.toBeInstanceOf(ConsultationPackageConfirmationError)
    expect(documentPackagesRepository.confirm).not.toHaveBeenCalled()
  })
})
