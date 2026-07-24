import type { Intake, IntakeCreation, IntakeUpdate } from '../domain/entities'

export type UpdateIntakesRepositoryParams = {
  intakeId: string
  expectedVersion: number
  changes: IntakeUpdate
}

export interface IntakesRepository {
  add(intake: IntakeCreation): Promise<Intake>
  addMany(intakes: IntakeCreation[]): Promise<Intake[]>
  findById(intakeId: string): Promise<Intake | undefined>
  findBySequenceNumber(sequenceNumber: number): Promise<Intake | undefined>
  findByClientId(clientId: string): Promise<Intake[]>
  replace(params: UpdateIntakesRepositoryParams): Promise<Intake | undefined>
}
