import { Module } from '@nestjs/common'

import { AuthModule } from '@/identity/auth.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ActiveAdminGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import {
  GetClientController,
  GrantClientConsentController,
  CompleteSignInController,
  GetCurrentCollaboratorController,
  LookupClientController,
  ListCollaboratorsController,
  ListCollaboratorJobTitlesController,
  GetCollaboratorController,
  RegisterCollaboratorController,
  ResendCollaboratorInvitationController,
  DeactivateCollaboratorController,
  ReactivateCollaboratorController,
  CancelCollaboratorInvitationController,
  RemoveCancelledCollaboratorController,
  UpdateCollaboratorController,
  RegisterClientController,
  SignInController,
  ListClientsController,
} from '@/identity/rest/controllers'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [AuthModule, IdentityDatabaseModule, LegalCatalogModule, ProvisionModule],
  providers: [ActiveAdminGuard, ActiveCollaboratorGuard],
  controllers: [
    GetClientController,
    LookupClientController,
    RegisterClientController,
    GrantClientConsentController,
    SignInController,
    ListClientsController,
    RegisterCollaboratorController,
    CompleteSignInController,
    GetCurrentCollaboratorController,
    ListCollaboratorsController,
    ListCollaboratorJobTitlesController,
    GetCollaboratorController,
    ResendCollaboratorInvitationController,
    DeactivateCollaboratorController,
    ReactivateCollaboratorController,
    CancelCollaboratorInvitationController,
    RemoveCancelledCollaboratorController,
    UpdateCollaboratorController,
  ],
  exports: [
    AuthModule,
    IdentityDatabaseModule,
    ActiveAdminGuard,
    ActiveCollaboratorGuard,
  ],
})
export class IdentityModule {}
