import { Module } from '@nestjs/common'

import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SharedModule } from '@/shared/shared.module'
import { SchedulingModule } from './scheduling/database/drizzle/repositories/scheduling.module'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    LegalCatalogModule,
    IntakeModule,
    SchedulingModule,
  ],
})
export class AppModule {}
