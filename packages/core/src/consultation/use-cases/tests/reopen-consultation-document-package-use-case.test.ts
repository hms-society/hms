import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentPackageFaker } from '../../../document-production/domain/entities/fakers'
import type { DocumentPackagesRepository } from '../../../document-production/interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { ConsultationFaker } from '../../domain/entities/fakers'
import { ConsultationPackageConfirmationError } from '../../domain/errors'
import type { ConsultationsRepository } from '../../interfaces'
import { ReopenConsultationDocumentPackageUseCase } from '../reopen-consultation-document-package-use-case'

describe('Reopen Consultation Document Package Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ReopenConsultationDocumentPackageUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new ReopenConsultationDocumentPackageUseCase(
      consultationsRepository,
      documentPackagesRepository,
      datetimeProvider,
    )
  })

  it('reopens a confirmed package for the assigned lawyer', async () => {
    const consultationId = '00000000-0000-4000-8000-000000000301'
    const collaboratorId = '00000000-0000-4000-8000-000000000302'
    const reopenedAt = new Date('2026-08-21T13:00:00.000Z')
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'consultation', consultationId },
      confirmedAt: new Date('2026-08-21T12:00:00.000Z'),
      confirmedByCollaboratorId: collaboratorId,
    })

    consultationsRepository.findById.mockResolvedValue(
      ConsultationFaker.fake({
        id: consultationId,
        assignedLawyerId: collaboratorId,
        attendanceFinalizedAt: new Date('2026-08-21T11:00:00.000Z'),
      }),
    )
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    documentPackagesRepository.reopen.mockResolvedValue({
      ...documentPackage,
      confirmedAt: undefined,
      confirmedByCollaboratorId: undefined,
      updatedAt: reopenedAt,
    })
    datetimeProvider.now.mockReturnValue(reopenedAt)

    await expect(
      useCase.execute({
        consultationId,
        collaboratorId,
        collaboratorProfile: 'lawyer',
      }),
    ).resolves.toBeUndefined()
    expect(documentPackagesRepository.reopen).toHaveBeenCalledWith(
      documentPackage.id,
      reopenedAt,
    )
  })

  it('rejects reopening when the package is not confirmed', async () => {
    const consultationId = '00000000-0000-4000-8000-000000000303'
    const collaboratorId = '00000000-0000-4000-8000-000000000304'
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'consultation', consultationId },
    })

    consultationsRepository.findById.mockResolvedValue(
      ConsultationFaker.fake({
        id: consultationId,
        assignedLawyerId: collaboratorId,
        attendanceFinalizedAt: new Date('2026-08-21T11:00:00.000Z'),
      }),
    )
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)

    await expect(
      useCase.execute({
        consultationId,
        collaboratorId,
        collaboratorProfile: 'lawyer',
      }),
    ).rejects.toBeInstanceOf(ConsultationPackageConfirmationError)
    expect(documentPackagesRepository.reopen).not.toHaveBeenCalled()
  })
})
