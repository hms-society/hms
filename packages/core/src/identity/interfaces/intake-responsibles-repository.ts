import type { ResponsibleListProjection } from '../domain/structures'

export interface IntakeResponsiblesRepository {
  findResponsiblesByIds(
    responsibleIds: readonly string[],
  ): Promise<readonly ResponsibleListProjection[]>
  listResponsibleOptions(): Promise<readonly ResponsibleListProjection[]>
}
