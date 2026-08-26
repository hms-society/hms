import type { Formalization } from './formalization'

export type FormalizationCreation = Omit<Formalization, 'createdAt' | 'updatedAt'>
