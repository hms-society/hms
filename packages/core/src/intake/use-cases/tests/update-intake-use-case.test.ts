import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '../../domain/entities/fakers'
import { InvalidIntakeUpdateError } from '../../domain/errors'
import { IntakeStatus } from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { UpdateIntakeUseCase } from '../update-intake-use-case'

describe('Update Intake Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it('updates the editable fields with optimistic version control', async () => {
    const currentIntake = IntakeFaker.fake({ status: IntakeStatus.ConsultationScheduled })
    const updatedIntake = IntakeFaker.fake({
      id: currentIntake.id,
      version: currentIntake.version + 1,
      updatedBy: 'updated-by',
    })
    repository.findById.mockResolvedValue(currentIntake)
    repository.replace.mockResolvedValue(updatedIntake)
    const useCase = new UpdateIntakeUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        expectedVersion: currentIntake.version,
        updatedBy: 'updated-by',
        responsibleId: 'responsible-updated',
        origin: 'referral',
        contactChannel: 'email',
        legalAreaId: 'area-updated',
        legalTopicId: 'topic-updated',
        urgency: 'urgent',
        demandNotes: '  Demanda revisada  ',
      }),
    ).resolves.toBe(updatedIntake)

    expect(repository.replace).toHaveBeenCalledWith({
      intakeId: currentIntake.id,
      expectedVersion: currentIntake.version,
      changes: {
        responsibleId: 'responsible-updated',
        origin: 'referral',
        contactChannel: 'email',
        legalAreaId: 'area-updated',
        legalTopicId: 'topic-updated',
        urgency: 'urgent',
        demandNotes: 'Demanda revisada',
        updatedBy: 'updated-by',
      },
    })
  })

  it('rejects updates for terminal intakes', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.Contracted })
    repository.findById.mockResolvedValue(intake)
    const useCase = new UpdateIntakeUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: intake.id,
        expectedVersion: intake.version,
        updatedBy: intake.updatedBy,
        responsibleId: intake.responsibleId,
        origin: intake.origin,
        contactChannel: intake.contactChannel,
        legalAreaId: intake.legalAreaId,
        legalTopicId: intake.legalTopicId,
        urgency: intake.urgency,
      }),
    ).rejects.toBeInstanceOf(InvalidIntakeUpdateError)

    expect(repository.replace).not.toHaveBeenCalled()
  })
})
