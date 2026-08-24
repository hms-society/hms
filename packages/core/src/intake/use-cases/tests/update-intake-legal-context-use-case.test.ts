import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '#intake/domain/entities/fakers'
import { IntakeStatus } from '#intake/domain/structures'
import type { IntakesRepository } from '#intake/interfaces'

import { UpdateIntakeLegalContextUseCase } from '../update-intake-legal-context-use-case'

describe('Update Intake Legal Context Use Case', () => {
  let intakesRepository: MockProxy<IntakesRepository>
  let useCase: UpdateIntakeLegalContextUseCase

  beforeEach(() => {
    intakesRepository = mock<IntakesRepository>()
    useCase = new UpdateIntakeLegalContextUseCase(intakesRepository)
  })

  it('updates the legal context using the current intake version', async () => {
    const intake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationScheduled,
      version: 3,
    })
    const updatedIntake = IntakeFaker.fake({
      ...intake,
      version: 4,
      legalAreaId: '11111111-1111-4111-8111-111111111111',
      legalTopicId: '22222222-2222-4222-8222-222222222222',
    })
    intakesRepository.findById.mockResolvedValue(intake)
    intakesRepository.replace.mockResolvedValue(updatedIntake)

    await expect(
      useCase.execute({
        intakeId: intake.id,
        legalAreaId: updatedIntake.legalAreaId as string,
        legalTopicId: updatedIntake.legalTopicId as string,
        updatedBy: 'collaborator-id',
      }),
    ).resolves.toBe(updatedIntake)

    expect(intakesRepository.replace).toHaveBeenCalledWith({
      intakeId: intake.id,
      expectedVersion: 3,
      changes: {
        legalAreaId: updatedIntake.legalAreaId,
        legalTopicId: updatedIntake.legalTopicId,
        updatedBy: 'collaborator-id',
      },
    })
  })

  it('does not write when the legal context is already synchronized', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.ConsultationScheduled })
    intakesRepository.findById.mockResolvedValue(intake)

    await expect(
      useCase.execute({
        intakeId: intake.id,
        legalAreaId: intake.legalAreaId as string,
        legalTopicId: intake.legalTopicId as string,
        updatedBy: 'collaborator-id',
      }),
    ).resolves.toBe(intake)

    expect(intakesRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects synchronization for terminal intakes', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.Contracted })
    intakesRepository.findById.mockResolvedValue(intake)

    await expect(
      useCase.execute({
        intakeId: intake.id,
        legalAreaId: '11111111-1111-4111-8111-111111111111',
        legalTopicId: '22222222-2222-4222-8222-222222222222',
        updatedBy: 'collaborator-id',
      }),
    ).rejects.toThrow('Intakes em estado terminal não podem ser editados.')
  })
})
