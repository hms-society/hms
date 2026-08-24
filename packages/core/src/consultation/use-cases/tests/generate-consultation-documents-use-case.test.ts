import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { IntakesRepository } from '../../../intake/interfaces'
import { ClientFaker } from '../../../identity/domain/entities/fakers'
import type { ClientsRepository } from '../../../identity/interfaces'
import type { LegalExpertiseCatalogProvider } from '../../../legal-catalog/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { GenerateConsultationDocumentsUseCase } from '../generate-consultation-documents-use-case'

describe('Generate Consultation Documents Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let intakesRepository: MockProxy<IntakesRepository>
  let clientsRepository: MockProxy<ClientsRepository>
  let legalExpertiseCatalogProvider: MockProxy<LegalExpertiseCatalogProvider>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let generationsRepository: MockProxy<DocumentGenerationsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let broker: MockProxy<Broker>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let idProvider: MockProxy<IdProvider>
  let useCase: GenerateConsultationDocumentsUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    intakesRepository = mock<IntakesRepository>()
    clientsRepository = mock<ClientsRepository>()
    legalExpertiseCatalogProvider = mock<LegalExpertiseCatalogProvider>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    generationsRepository = mock<DocumentGenerationsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    broker = mock<Broker>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider = mock<IdProvider>()
    useCase = new GenerateConsultationDocumentsUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      legalExpertiseCatalogProvider,
      documentPackagesRepository,
      packageDocumentsRepository,
      generationsRepository,
      versionsRepository,
      broker,
      datetimeProvider,
      idProvider,
    )
  })

  it('allows an administrator to batch-generate documents in any consultation', async () => {
    const consultation = ConsultationFaker.fake()
    const intake = {
      id: consultation.intakeId,
    } as Awaited<ReturnType<IntakesRepository['findById']>>
    const client = ClientFaker.fake({ id: consultation.clientId })
    const legalContext = {
      legalArea: {
        id: consultation.legalAreaId!,
        name: 'Direito Civil',
        active: true,
      },
      legalTopics: [
        {
          id: consultation.legalTopicId!,
          name: 'Locação residencial',
          active: true,
        },
      ],
    }
    const createdAt = new Date('2026-08-12T18:00:00.000Z')
    const documentPackageId = '6c42cf59-5102-4bb8-9513-a47c8ffea1e8'
    const eligibleDocumentId = 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2'
    const existingDocumentId = 'a6272055-bf75-4f37-9a5d-e6a94af66d30'
    consultationsRepository.findById.mockResolvedValue(consultation)
    intakesRepository.findById.mockResolvedValue(intake)
    clientsRepository.findById.mockResolvedValue(client)
    legalExpertiseCatalogProvider.resolve.mockResolvedValue([legalContext])
    documentPackagesRepository.findByContext.mockResolvedValue({
      id: documentPackageId,
      context: { type: 'consultation', consultationId: consultation.id },
      documents: [],
      createdAt,
      updatedAt: createdAt,
    })
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      {
        id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
        documentPackageId,
        documentId: eligibleDocumentId,
        documentSpecificationId: 'ed3ea792-6cb4-4af4-b752-f936f1f92113',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '84921a66-7fe9-460f-af67-ec92b7029d4a',
        documentPackageId,
        documentId: existingDocumentId,
        documentSpecificationId: 'd3c015e0-c2df-4324-a052-dd2927246185',
        createdAt,
        updatedAt: createdAt,
      },
    ])
    generationsRepository.findLatestByDocumentId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ id: 'existing' } as never)
    versionsRepository.findLatestByDocumentId.mockResolvedValue(undefined)
    idProvider.generate.mockReturnValue('28428a23-fbc7-4bad-8b44-38de85a73cf7')
    datetimeProvider.now.mockReturnValue(createdAt)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        requestedByCollaboratorId: 'admin-collaborator-id',
        requestedByCollaboratorProfile: 'admin',
      }),
    ).resolves.toEqual([
      {
        documentGenerationId: '28428a23-fbc7-4bad-8b44-38de85a73cf7',
        documentId: eligibleDocumentId,
      },
    ])
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document-batch.generation-requested',
        payload: expect.objectContaining({
          documents: [expect.objectContaining({ documentId: eligibleDocumentId })],
          source: {
            type: 'consultation',
            id: consultation.id,
            data: {
              consultation,
              intake,
              client: {
                id: client.id,
                type: client.type,
                name: client.name,
                taxId: client.taxId,
                email: client.email,
                phone: client.phone,
                address: client.address,
              },
              legalContext: {
                area: legalContext.legalArea,
                topic: legalContext.legalTopics[0],
              },
            },
          },
        }),
      }),
    )
  })

  it('returns an empty list when the consultation has no package', async () => {
    const consultation = ConsultationFaker.fake()
    consultationsRepository.findById.mockResolvedValue(consultation)
    intakesRepository.findById.mockResolvedValue({
      id: consultation.intakeId,
    } as Awaited<ReturnType<IntakesRepository['findById']>>)
    clientsRepository.findById.mockResolvedValue(
      ClientFaker.fake({ id: consultation.clientId }),
    )
    legalExpertiseCatalogProvider.resolve.mockResolvedValue([
      {
        legalArea: {
          id: consultation.legalAreaId!,
          name: 'Direito Civil',
          active: true,
        },
        legalTopics: [
          {
            id: consultation.legalTopicId!,
            name: 'Locação residencial',
            active: true,
          },
        ],
      },
    ])
    documentPackagesRepository.findByContext.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        requestedByCollaboratorId: consultation.assignedLawyerId,
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).resolves.toEqual([])
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
