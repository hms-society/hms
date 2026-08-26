import type { IntakeClosureReason } from '../../intake/domain/structures/intake-closure-reason'

export type CloseFormalizationRequest = {
  readonly formalizationId: string
  readonly intakeId: string
  readonly actorId: string
  readonly reason: IntakeClosureReason
  readonly notes?: string
  readonly expectedIntakeVersion: number
  readonly expectedFormalizationVersion: number
  readonly cancelledAt: Date
}
