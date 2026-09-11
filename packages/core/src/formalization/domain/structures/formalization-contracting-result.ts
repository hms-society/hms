export type FormalizationContractingResult = {
  readonly formalizationId: string
  readonly formalizationStatus: 'completed'
  readonly formalizationVersion: number
  readonly intakeId: string
  readonly intakeStatus: 'contracted'
  readonly intakeVersion: number
  readonly contractedAt: Date
  readonly duplicate: boolean
}
