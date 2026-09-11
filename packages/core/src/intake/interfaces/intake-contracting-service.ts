import type { Intake } from '../domain/entities'

export interface IntakeContractingService {
  contract(input: {
    readonly intakeId: string
    readonly expectedVersion: number
    readonly contractedAt: Date
    readonly updatedBy: string
  }): Promise<Intake>
}
