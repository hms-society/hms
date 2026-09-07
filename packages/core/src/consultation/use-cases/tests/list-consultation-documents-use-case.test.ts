import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { DocumentGenerationFaker } from '../../../document-production/domain/entities/fakers'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { ListConsultationDocumentsUseCase } from '../list-consultation-documents-use-case'

describe('List Consultation Documents Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentsRepository: MockProxy<DocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let generationsRepository: MockProxy<DocumentGenerationsRepository>
  let useCase: ListConsultationDocumentsUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentsRepository = mock<DocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    generationsRepository = mock<DocumentGenerationsRepository>()
    generationsRepository.findLatestByDocumentIds.mockResolvedValue([])
    useCase = new ListConsultationDocumentsUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
      generationsRepository,
    )
  })

  it('allows an administrator to list any consultation documents', async () => {
    const consultation = ConsultationFaker.fake()
    const documentPackage = {
      id: '11c8ee44-962c-4975-a1f4-fb0f28cdf889',
      context: { type: 'consultation' as const, consultationId: consultation.id },
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const document = {
      id: 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2',
      title: 'Procuração',
      classificacaoAcesso: 'INTERNO' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const packageDocument = {
      id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
      documentPackageId: documentPackage.id,
      documentId: document.id,
      documentSpecificationId: 'f7471138-f86c-49db-952e-5e21dd65d3fd',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const version = {
      id: '2f952206-5e7d-4930-bd46-e55cded671fc',
      documentId: document.id,
    } as Awaited<ReturnType<DocumentVersionsRepository['findById']>> & {}
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      packageDocument,
    ])
    documentsRepository.findByIds.mockResolvedValue([document])
    versionsRepository.findByDocumentIds.mockResolvedValue([version])

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: 'admin-collaborator-id',
        collaboratorProfile: 'admin',
      }),
    ).resolves.toEqual([{ document, versions: [version] }])
  })

  it('returns the latest active generation status for each document', async () => {
    const consultation = ConsultationFaker.fake()
    const documentPackage = {
      id: '11c8ee44-962c-4975-a1f4-fb0f28cdf889',
      context: { type: 'consultation' as const, consultationId: consultation.id },
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const document = {
      id: 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2',
      title: 'Procuração',
      classificacaoAcesso: 'INTERNO' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const packageDocument = {
      id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
      documentPackageId: documentPackage.id,
      documentId: document.id,
      documentSpecificationId: 'f7471138-f86c-49db-952e-5e21dd65d3fd',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const generation = DocumentGenerationFaker.fake({
      documentId: document.id,
      status: 'running',
    })
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      packageDocument,
    ])
    documentsRepository.findByIds.mockResolvedValue([document])
    versionsRepository.findByDocumentIds.mockResolvedValue([])
    generationsRepository.findLatestByDocumentIds.mockResolvedValue([generation])

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: 'admin-collaborator-id',
        collaboratorProfile: 'admin',
      }),
    ).resolves.toEqual([{ document, generationStatus: 'running', versions: [] }])
  })
})
