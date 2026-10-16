import { Inject, Injectable } from '@nestjs/common'
import type { CaseOpeningSourceProvider } from '@hms/core/case-management/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'

@Injectable()
export class RepositoryCaseOpeningSourceProvider implements CaseOpeningSourceProvider {
  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    private readonly consultationsRepository: ConsultationsRepository,
  ) {}

  async findByIntakeId(intakeId: string) {
    const intake = await this.intakesRepository.findById(intakeId)
    if (!intake) return undefined
    const consultation = await this.consultationsRepository.findByIntakeId(intakeId)
    return {
      intakeId: intake.id,
      clientId: intake.clientId,
      assignedLawyerId: consultation?.assignedLawyerId,
    }
  }
}
