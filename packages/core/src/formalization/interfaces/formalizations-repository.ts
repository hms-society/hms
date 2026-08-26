import type {
  Formalization,
  FormalizationCreation,
} from '../domain/entities'
import type { ReplaceFormalizationParams } from './replace-formalization-params'

export interface FormalizationsRepository {
  findById(formalizationId: string): Promise<Formalization | undefined>
  findByIntakeId(intakeId: string): Promise<Formalization | undefined>
  addOrGet(formalization: FormalizationCreation): Promise<Formalization>
  replace(params: ReplaceFormalizationParams): Promise<Formalization | undefined>
  removeAll(): Promise<void>
}
