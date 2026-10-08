import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database/case-management-database.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { CASE_IDENTITY_TRANSACTION } from '@/shared/database/constants/case-identity-transaction'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DrizzleCaseIdentityTransaction } from '@/shared/database/drizzle/repositories/drizzle-case-identity-transaction'

@Module({
  imports: [SharedDatabaseModule, CaseManagementDatabaseModule, IdentityDatabaseModule],
  providers: [
    DrizzleCaseIdentityTransaction,
    {
      provide: CASE_IDENTITY_TRANSACTION,
      useExisting: DrizzleCaseIdentityTransaction,
    },
  ],
  exports: [CASE_IDENTITY_TRANSACTION],
})
export class CaseIdentityTransactionModule {}
