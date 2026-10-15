import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseIdentityTransaction,
  CaseIdentityTransactionScope,
} from '@hms/core/shared/interfaces'
import { sql } from 'drizzle-orm'

import { IdentityTransactionScopeProvider } from '@/identity/database/drizzle/identity-transaction-scope-provider'
import { CaseManagementTransactionScopeProvider } from '@/case-management/database/drizzle/case-management-transaction-scope-provider'
import type { IdentityDatabaseExecutor } from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleCaseIdentityTransaction implements CaseIdentityTransaction {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    private readonly identityScopeProvider: IdentityTransactionScopeProvider,
    private readonly caseScopeProvider: CaseManagementTransactionScopeProvider,
  ) {}

  async run<Result>(
    operation: (scope: CaseIdentityTransactionScope) => Promise<Result>,
  ): Promise<Result> {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      // 1002 is reserved for Case/Identity continuity; 1001 remains case-code generation.
      await transaction.execute(sql`SELECT pg_advisory_xact_lock(1002)`)

      return operation({
        identity: this.identityScopeProvider.create(
          transaction as IdentityDatabaseExecutor,
        ),
        cases: this.caseScopeProvider.create(
          transaction as Parameters<CaseManagementTransactionScopeProvider['create']>[0],
        ),
      })
    })
  }
}
