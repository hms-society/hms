import type { DynamicForm } from '../entities/dynamic-form'

export type DynamicFormCreation = Omit<DynamicForm, 'id' | 'createdAt' | 'updatedAt'>
