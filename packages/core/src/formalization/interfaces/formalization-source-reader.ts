import type { Formalization } from '../domain/entities'
import type { FormalizationContext } from './formalization-context'
import type { FormalizationStartSource } from './formalization-start-source'
import type { DynamicForm } from '../../shared/domain/entities'

export interface FormalizationSourceReader {
  findStartSource(intakeId: string): Promise<FormalizationStartSource | undefined>
  findContractForm(
    formalization: Formalization,
    dynamicFormId: string,
  ): Promise<DynamicForm | undefined>
  findContext(formalization: Formalization): Promise<FormalizationContext | undefined>
}
