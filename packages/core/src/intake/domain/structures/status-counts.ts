import type { IntakeListStatus } from './intake-list-status'

export type StatusCounts = {
  readonly all: number
  readonly byStatus: Readonly<Record<IntakeListStatus, number>>
  readonly compatibility: {
    readonly registered: number
  }
}
