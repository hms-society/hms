import type {
  CaseCreationOperation,
  CaseCreationOperationCreation,
} from '../domain/entities'

export interface CaseCreationOperationsRepository {
  findByKey(
    actorId: string,
    operationId: string,
  ): Promise<CaseCreationOperation | undefined>
  add(input: CaseCreationOperationCreation): Promise<CaseCreationOperation>
  removeAll(): Promise<void>
}
