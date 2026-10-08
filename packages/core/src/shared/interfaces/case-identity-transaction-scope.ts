import type { CaseTeamScope } from '../../case-management/interfaces/case-team-scope'
import type { IdentityTransactionScope } from '../../identity/interfaces/identity-transaction-scope'

export interface CaseIdentityTransactionScope {
  readonly identity: IdentityTransactionScope
  readonly cases: CaseTeamScope
}
