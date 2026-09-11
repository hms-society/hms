import { Inject, Injectable } from '@nestjs/common'
import type { IntakeContractingService } from '@hms/core/intake/interfaces'
import { ContractIntakeFromFormalizationUseCase } from '@hms/core/intake/use-cases'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

@Injectable()
export class IntakeContractingProvider implements IntakeContractingService {
  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
  ) {}

  async contract(input: Parameters<IntakeContractingService['contract']>[0]) {
    const intake = await this.intakesRepository.findById(input.intakeId)
    if (intake?.status === IntakeStatus.Contracted && intake.contractedAt) return intake

    return new ContractIntakeFromFormalizationUseCase(this.intakesRepository).execute(
      input,
    )
  }
}
