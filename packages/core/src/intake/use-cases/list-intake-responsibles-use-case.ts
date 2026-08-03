import type { ResponsibleListProjection } from '../../identity/domain/structures'
import type { IntakeResponsiblesRepository } from '../../identity/interfaces'

export class ListIntakeResponsiblesUseCase {
  constructor(
    private readonly intakeResponsiblesRepository: IntakeResponsiblesRepository,
  ) {}

  execute(): Promise<readonly ResponsibleListProjection[]> {
    return this.intakeResponsiblesRepository.listResponsibleOptions()
  }
}
