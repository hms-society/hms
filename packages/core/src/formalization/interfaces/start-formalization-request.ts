import type { FormalizationCreation } from '../domain/entities'

export type StartFormalizationRequest = {
  readonly formalization: FormalizationCreation
  readonly actorId: string
  readonly expectedIntakeVersion: number
}
