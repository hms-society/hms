import { Module } from '@nestjs/common'

import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import {
  CloseIntakeWithoutContractController,
  GetIntakesController,
  ListClientIntakesController,
  RegisterIntakesController,
  TransitionIntakeStatusController,
} from '@/intake/rest/controllers'

@Module({
  imports: [IdentityModule, IntakeDatabaseModule, ProvisionModule],
  controllers: [
    RegisterIntakesController,
    GetIntakesController,
    ListClientIntakesController,
    TransitionIntakeStatusController,
    CloseIntakeWithoutContractController,
  ],
})
export class IntakeModule {}
