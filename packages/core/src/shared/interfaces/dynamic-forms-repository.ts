import type { DynamicForm, DynamicFormCreation } from '../domain'

export interface DynamicFormsRepository {
  list(): Promise<DynamicForm[]>
  addMany(forms: readonly DynamicFormCreation[]): Promise<DynamicForm[]>
  removeAll(): Promise<void>
}
