import { Module } from '@nestjs/common'
import { IdentityCollaboratorsDatabaseModule } from '@/identity/database/identity-collaborators-database.module'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { RepositoryCaseCollaboratorsProvider } from '@/case-management/provision/repository-case-collaborators-provider'

@Module({
  imports: [IdentityCollaboratorsDatabaseModule],
  providers: [
    RepositoryCaseCollaboratorsProvider,
    {
      provide: CASE_MANAGEMENT_PROVIDERS.collaborators,
      useExisting: RepositoryCaseCollaboratorsProvider,
    },
  ],
  exports: [CASE_MANAGEMENT_PROVIDERS.collaborators],
})
export class CaseCollaboratorsProvisionModule {}
