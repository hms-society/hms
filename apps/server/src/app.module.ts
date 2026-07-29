import { Module } from '@nestjs/common'

import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SharedModule } from '@/shared/shared.module'

@Module({
  imports: [SharedModule, IdentityModule, LegalCatalogModule, IntakeModule],
})
export class AppModule {}
