import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
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
import { ConsultationDocumentAccessDeniedError } from '../../domain/errors'
import type { ConsultationsRepository } from '../../interfaces'
import { GenerateConsultationDocumentUseCase } from '../generate-consultation-document-use-case'

describe('Generate Consultation Document Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let intakesRepository: MockProxy<IntakesRepository>
  let clientsRepository: MockProxy<ClientsRepository>
  let legalExpertiseCatalogProvider: MockProxy<LegalExpertiseCatalogProvider>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let generationsRepository: MockProxy<DocumentGenerationsRepository>
  let broker: MockProxy<Broker>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let idProvider: MockProxy<IdProvider>
  let useCase: GenerateConsultationDocumentUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    intakesRepository = mock<IntakesRepository>()
    clientsRepository = mock<ClientsRepository>()
    legalExpertiseCatalogProvider = mock<LegalExpertiseCatalogProvider>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    generationsRepository = mock<DocumentGenerationsRepository>()
    broker = mock<Broker>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider = mock<IdProvider>()
    useCase = new GenerateConsultationDocumentUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      legalExpertiseCatalogProvider,
      documentPackagesRepository,
      packageDocumentsRepository,
      generationsRepository,
      broker,
      datetimeProvider,
      idProvider,
    )
  })

  it('publishes a generation request with consultation and intake data', async () => {
    const consultation = ConsultationFaker.fake()
    const intake = {
      id: consultation.intakeId,
      clientId: consultation.clientId,
    } as Awaited<ReturnType<IntakesRepository['findById']>>
    const client = ClientFaker.fake({ id: consultation.clientId })
    const legalContext = {
      legalArea: {
        id: consultation.legalAreaId,
        name: 'Direito Civil',
        active: true,
      },
      legalTopics: [
        {
          id: consultation.legalTopicId,
          name: 'Locação residencial',
          active: true,
        },
      ],
    }
    const documentPackageId = '6c42cf59-5102-4bb8-9513-a47c8ffea1e8'
    const documentId = 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2'
    const documentSpecificationId = 'ed3ea792-6cb4-4af4-b752-f936f1f92113'
    const generationId = '28428a23-fbc7-4bad-8b44-38de85a73cf7'
    const occurredAt = new Date('2026-08-12T18:00:00.000Z')
    consultationsRepository.findById.mockResolvedValue(consultation)
    intakesRepository.findById.mockResolvedValue(intake)
    clientsRepository.findById.mockResolvedValue(client)
    legalExpertiseCatalogProvider.resolve.mockResolvedValue([legalContext])
    documentPackagesRepository.findByContext.mockResolvedValue({
      id: documentPackageId,
      context: { type: 'consultation', consultationId: consultation.id },
      documents: [],
      createdAt: occurredAt,
      updatedAt: occurredAt,
    })
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      {
        id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
        documentPackageId,
        documentId,
        documentSpecificationId,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      },
    ])
    generationsRepository.findLatestByDocumentId.mockResolvedValue(undefined)
    idProvider.generate.mockReturnValue(generationId)
    datetimeProvider.now.mockReturnValue(occurredAt)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId,
        requestedByCollaboratorId: consultation.assignedLawyerId,
      }),
    ).resolves.toEqual({ documentGenerationId: generationId, documentId })
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document.generation-requested',
        payload: expect.objectContaining({
          documentGenerationId: generationId,
          documentId,
          documentSpecificationVersionId: documentSpecificationId,
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
    expect(clientsRepository.findById).toHaveBeenCalledWith(consultation.clientId)
    expect(legalExpertiseCatalogProvider.resolve).toHaveBeenCalledWith([
      {
        legalAreaId: consultation.legalAreaId,
        legalTopicIds: [consultation.legalTopicId],
      },
    ])
  })

  it('rejects a collaborator who is not the associated lawyer', async () => {
    const consultation = ConsultationFaker.fake()
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId: 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2',
        requestedByCollaboratorId: '2f952206-5e7d-4930-bd46-e55cded671fc',
      }),
    ).rejects.toBeInstanceOf(ConsultationDocumentAccessDeniedError)
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
