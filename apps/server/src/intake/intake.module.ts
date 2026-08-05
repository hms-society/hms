import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import {
  CloseIntakeWithoutContractController,
  GetIntakesController,
  ListIntakeResponsiblesController,
  ListClientIntakesController,
  ListIntakesController,
  RegisterIntakesController,
  TransitionIntakeStatusController,
} from '@/intake/rest/controllers'

@Module({
  imports: [IdentityModule, IntakeDatabaseModule, ProvisionModule],
  controllers: [
    RegisterIntakesController,
    ListIntakesController,
    ListIntakeResponsiblesController,
    GetIntakesController,
    ListClientIntakesController,
    TransitionIntakeStatusController,
    CloseIntakeWithoutContractController,
  ],
})
export class IntakeModule {}
