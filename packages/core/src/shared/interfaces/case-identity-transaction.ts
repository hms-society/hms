import type { CaseIdentityTransactionScope } from './case-identity-transaction-scope'

export interface CaseIdentityTransaction {
  run<Result>(
    operation: (scope: CaseIdentityTransactionScope) => Promise<Result>,
  ): Promise<Result>
}
