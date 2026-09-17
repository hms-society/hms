import type { DynamicForm } from '../entities/dynamic-form'

export type DynamicFormReplaceResult =
  | { kind: 'updated'; form: DynamicForm }
  | { kind: 'unchanged'; form: DynamicForm }
  | { kind: 'not_found' }
  | { kind: 'version_conflict'; currentVersion: number }
