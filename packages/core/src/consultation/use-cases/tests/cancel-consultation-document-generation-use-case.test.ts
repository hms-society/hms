import type { Broker, DatetimeProvider } from '#shared/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../../document-production/domain/entities/fakers'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { ConsultationFaker } from '../../domain/entities/fakers'
import { ConsultationDocumentAccessDeniedError } from '../../domain/errors'
import type { ConsultationsRepository } from '../../interfaces'
import { CancelConsultationDocumentGenerationUseCase } from '../cancel-consultation-document-generation-use-case'

describe('Cancel Consultation Document Generation Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let generationsRepository: MockProxy<DocumentGenerationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>
  let useCase: CancelConsultationDocumentGenerationUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    generationsRepository = mock<DocumentGenerationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    useCase = new CancelConsultationDocumentGenerationUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      generationsRepository,
      datetimeProvider,
      broker,
    )
  })

  it('allows an administrator to cancel the latest active generation', async () => {
    const consultation = ConsultationFaker.fake({
      assignedLawyerId: 'assigned-lawyer-id',
    })
    const documentId = 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2'
    const documentPackage = {
      id: '6c42cf59-5102-4bb8-9513-a47c8ffea1e8',
      context: { type: 'consultation' as const, consultationId: consultation.id },
      documents: [],
      createdAt: new Date('2026-08-14T10:00:00.000Z'),
      updatedAt: new Date('2026-08-14T10:00:00.000Z'),
    }
    const packageDocument = {
      id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
      documentPackageId: documentPackage.id,
      documentId,
      documentSpecificationId: 'ed3ea792-6cb4-4af4-b752-f936f1f92113',
      createdAt: documentPackage.createdAt,
      updatedAt: documentPackage.updatedAt,
    }
    const generation = DocumentGenerationFaker.fake({
      documentId,
      status: 'running',
    })
    const now = new Date('2026-08-14T10:05:00.000Z')
    const cancelled = DocumentGenerationFaker.fake({
      ...generation,
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    })
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      packageDocument,
    ])
    generationsRepository.findLatestByDocumentId.mockResolvedValue(generation)
    generationsRepository.findById.mockResolvedValue(generation)
    generationsRepository.replace.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId,
        requestedByCollaboratorId: 'admin-id',
        requestedByCollaboratorProfile: 'admin',
      }),
    ).resolves.toBe(cancelled)

    expect(generationsRepository.replace).toHaveBeenCalledWith(
      generation.id,
      expect.objectContaining({ status: 'cancelled', cancelledAt: now }),
      ['pending', 'running'],
    )
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document.generation-cancelled',
        payload: expect.objectContaining({ documentGenerationId: generation.id }),
      }),
    )
  })

  it('rejects a collaborator who is not assigned to the consultation', async () => {
    const consultation = ConsultationFaker.fake({
      assignedLawyerId: 'assigned-lawyer-id',
    })
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId: 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2',
        requestedByCollaboratorId: 'another-lawyer-id',
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).rejects.toBeInstanceOf(ConsultationDocumentAccessDeniedError)
    expect(generationsRepository.findById).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
