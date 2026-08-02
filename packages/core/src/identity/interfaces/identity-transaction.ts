import type { IdentityTransactionScope } from './identity-transaction-scope'

export interface IdentityTransaction {
  run<Result>(
    operation: (scope: IdentityTransactionScope) => Promise<Result>,
  ): Promise<Result>
}
