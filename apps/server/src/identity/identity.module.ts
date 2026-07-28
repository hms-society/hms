import { Module } from '@nestjs/common'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { AuthGuard } from '@/identity/guards'
import {
  GetClientController,
  GrantClientConsentController,
  LookupClientController,
  RegisterClientController,
  SignInController,
} from '@/identity/rest/controllers'
import { SupabaseAuthProvider } from '@/identity/providers'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [IdentityDatabaseModule, ProvisionModule],
  controllers: [
    GetClientController,
    LookupClientController,
    RegisterClientController,
    GrantClientConsentController,
    SignInController,
  ],
  providers: [
    SupabaseAuthProvider,
    {
      provide: IDENTITY_PROVIDERS.auth,
      useExisting: SupabaseAuthProvider,
    },
    AuthGuard,
  ],
  exports: [IDENTITY_PROVIDERS.auth, AuthGuard],
})
export class IdentityModule {}
