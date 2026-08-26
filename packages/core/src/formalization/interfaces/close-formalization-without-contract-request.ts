import type { IntakeClosureReason } from '../../intake/domain/structures/intake-closure-reason'

export type CloseFormalizationWithoutContractRequest = {
  readonly expectedVersion: number
  readonly expectedIntakeVersion: number
  readonly reason: IntakeClosureReason
  readonly notes?: string
}
