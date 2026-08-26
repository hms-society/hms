import type { Formalization } from '../domain/entities'
import {
  FormalizationContractFormOpenError,
  FormalizationStateConflictError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'

export const FormalizationDocumentGuard = {
  assertFormClosed(formalization: Pick<Formalization, 'contractFormState'>): void {
    if (formalization.contractFormState !== FormalizationContractFormState.Closed) {
      throw new FormalizationContractFormOpenError()
    }
  },

  assertWritable(
    formalization: Pick<Formalization, 'contractFormState' | 'status'>,
  ): void {
    if (formalization.status === FormalizationStatus.Cancelled) {
      throw new FormalizationStateConflictError(
        'A formalização cancelada é somente leitura.',
      )
    }
    FormalizationDocumentGuard.assertFormClosed(formalization)
  },
} as const
