import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { AuthModule } from '@/identity/auth.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ActiveCollaboratorGuard } from '@/identity/guards/active-collaborator.guard'
import { ApplicationAccessGuard } from '@/identity/guards/application-access.guard'
import { CaseManagementDatabaseModule } from '@/case-management/database/case-management-database.module'

@Module({
  imports: [AuthModule, IdentityDatabaseModule, CaseManagementDatabaseModule],
  providers: [
    ActiveCollaboratorGuard,
    ApplicationAccessGuard,
    { provide: APP_GUARD, useExisting: ApplicationAccessGuard },
  ],
})
export class IdentityAccessModule {}
