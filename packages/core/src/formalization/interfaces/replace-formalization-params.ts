import type { FormalizationUpdate } from './formalization-repository-update'

export type ReplaceFormalizationParams = {
  readonly formalizationId: string
  readonly expectedVersion: number
  readonly changes: FormalizationUpdate
}
