import type { DynamicFormAnswer } from '../../shared/domain/structures'

export type SaveFormalizationContractFormRequest = {
  readonly expectedVersion: number
  readonly answers: readonly DynamicFormAnswer[]
}
