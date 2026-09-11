import type { FormalizationContractingResult } from '../domain/structures'

export interface FormalizationContractingTransaction {
  confirm(input: {
    readonly formalizationId: string
    readonly intakeId: string
    readonly requestId: string
    readonly expectedFormalizationVersion: number
    readonly expectedIntakeVersion: number
    readonly expectedRequestVersion: number
    readonly actorId: string
    readonly confirmationKey: string
    readonly contractedAt: Date
  }): Promise<
    | { readonly outcome: 'applied' | 'duplicate'; readonly result: FormalizationContractingResult }
    | { readonly outcome: 'conflict' }
  >
}
