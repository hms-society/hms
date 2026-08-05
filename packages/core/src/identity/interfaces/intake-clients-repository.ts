import type { ClientListProjection } from '../domain/structures'

export interface IntakeClientsRepository {
  findClientIdsBySearch(search: string): Promise<readonly string[]>
  findClientsByIds(clientIds: readonly string[]): Promise<readonly ClientListProjection[]>
}
