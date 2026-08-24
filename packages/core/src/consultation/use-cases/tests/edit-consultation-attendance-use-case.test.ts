import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '#consultation/domain/entities/fakers'
import { ConsultationStatus } from '#consultation/domain/structures'
import { CollaboratorProfile } from '#identity/domain/structures'
import type { ConsultationsRepository } from '#consultation/interfaces'

import { EditConsultationAttendanceUseCase } from '../edit-consultation-attendance-use-case'

describe('Edit Consultation Attendance Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let useCase: EditConsultationAttendanceUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    useCase = new EditConsultationAttendanceUseCase(consultationsRepository)
  })

  it('reopens a finalized attendance for its assigned lawyer', async () => {
    const consultation = ConsultationFaker.fake({
      assignedLawyerId: 'collaborator-id',
      status: ConsultationStatus.Pending,
      attendanceFinalizedAt: new Date('2026-08-19T11:00:00.000Z'),
      attendanceFinalizedByCollaboratorId: 'collaborator-id',
    })
    const editableConsultation = {
      ...consultation,
      attendanceFinalizedAt: undefined,
      attendanceFinalizedByCollaboratorId: undefined,
    }
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(editableConsultation)

    const result = await useCase.execute({
      consultationId: consultation.id,
      collaboratorId: 'collaborator-id',
      collaboratorProfile: CollaboratorProfile.Lawyer,
    })

    expect(result).toBe(editableConsultation)
    expect(consultationsRepository.replace).toHaveBeenCalledWith(consultation.id, {
      attendanceFinalizedAt: null,
      attendanceFinalizedByCollaboratorId: null,
    })
  })

  it("allows an administrator to edit another lawyer's consultation", async () => {
    const consultation = ConsultationFaker.fake({
      assignedLawyerId: 'assigned-lawyer-id',
      status: ConsultationStatus.Pending,
      attendanceFinalizedAt: new Date('2026-08-19T11:00:00.000Z'),
    })
    const editableConsultation = {
      ...consultation,
      attendanceFinalizedAt: undefined,
      attendanceFinalizedByCollaboratorId: undefined,
    }
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(editableConsultation)

    const result = await useCase.execute({
      consultationId: consultation.id,
      collaboratorId: 'administrator-id',
      collaboratorProfile: CollaboratorProfile.Admin,
    })

    expect(result).toBe(editableConsultation)
  })

  it('rejects editing by another non-admin collaborator', async () => {
    const consultation = ConsultationFaker.fake({
      assignedLawyerId: 'assigned-lawyer-id',
      status: ConsultationStatus.Pending,
      attendanceFinalizedAt: new Date('2026-08-19T11:00:00.000Z'),
    })
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: 'another-lawyer-id',
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow(
      'Somente o advogado associado ou um administrador pode editar a ficha de atendimento.',
    )

    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })
})
