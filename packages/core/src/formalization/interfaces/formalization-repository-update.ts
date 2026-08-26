import type { DynamicFormAnswer } from '../../shared/domain/structures'
import type { Formalization } from '../domain/entities'
import type {
  FormalizationContractFormState,
  FormalizationStatus,
} from '../domain/structures'

export type FormalizationUpdate = Partial<
  Pick<
    Formalization,
    | 'status'
    | 'contractFormId'
    | 'contractFormSnapshot'
    | 'contractFormAnswers'
    | 'contractFormState'
    | 'contractFormRevision'
    | 'contractFormClosedAt'
    | 'contractFormClosedByCollaboratorId'
    | 'documentsConfirmedAt'
    | 'documentsConfirmedByCollaboratorId'
    | 'documentsConfirmedRevision'
    | 'cancelledAt'
    | 'cancelledByCollaboratorId'
  >
> & {
  status?: FormalizationStatus
  contractFormState?: FormalizationContractFormState
  contractFormAnswers?: DynamicFormAnswer[]
}
