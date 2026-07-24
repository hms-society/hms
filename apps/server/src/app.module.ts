import { Module } from '@nestjs/common'

import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { SharedModule } from '@/shared/shared.module'

@Module({
  imports: [SharedModule, IdentityModule, IntakeModule],
})
export class AppModule {}
