export const FORMALIZATION_REPOSITORIES = {
  formalizations: Symbol('FORMALIZATION_REPOSITORIES.formalizations'),
} as const

export const FORMALIZATION_DATABASE_OPERATIONS = {
  startTransaction: Symbol('FORMALIZATION_DATABASE_OPERATIONS.startTransaction'),
  closeTransaction: Symbol('FORMALIZATION_DATABASE_OPERATIONS.closeTransaction'),
} as const
