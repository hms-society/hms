export type ConfirmFormalizationContractingCommand = {
  readonly expectedFormalizationVersion: number
  readonly expectedIntakeVersion: number
  readonly expectedRequestVersion: number
  readonly confirmationKey: string
}
