import { Module } from '@nestjs/common'

import { IdentityUsersDatabaseModule } from '@/identity/database/identity-users-database.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { AuthGuard } from '@/identity/guards'
import {
  SupabaseAuthAdministrationProvider,
  SupabaseAuthProvider,
} from '@/identity/providers'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [IdentityUsersDatabaseModule, ProvisionModule],
  providers: [
    SupabaseAuthProvider,
    SupabaseAuthAdministrationProvider,
    {
      provide: IDENTITY_PROVIDERS.auth,
      useExisting: SupabaseAuthProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.authAdministration,
      useExisting: SupabaseAuthAdministrationProvider,
    },
    AuthGuard,
  ],
  exports: [
    IdentityUsersDatabaseModule,
    IDENTITY_PROVIDERS.auth,
    IDENTITY_PROVIDERS.authAdministration,
    AuthGuard,
  ],
})
export class AuthModule {}
