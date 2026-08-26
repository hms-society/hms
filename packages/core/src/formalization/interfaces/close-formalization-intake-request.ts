import type { IntakeClosureReason } from '../../intake/domain/structures/intake-closure-reason'

export type CloseFormalizationIntakeRequest = {
  readonly intakeId: string
  readonly actorId: string
  readonly reason: IntakeClosureReason
  readonly notes?: string
  readonly expectedVersion: number
}
