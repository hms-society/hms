import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { IntakeMessagingModule } from '@/intake/messaging/intake-messaging.module'
import {
  CloseIntakeWithoutContractController,
  GetIntakesController,
  ListIntakeResponsiblesController,
  ListClientIntakesController,
  ListIntakesController,
  RegisterIntakesController,
  RetryIntakeConsultationSchedulingController,
  TransitionIntakeStatusController,
} from '@/intake/rest/controllers'

@Module({
  imports: [
    IdentityModule,
    IntakeDatabaseModule,
    IntakeMessagingModule,
    ProvisionModule,
    SharedMessagingModule,
  ],
  controllers: [
    RegisterIntakesController,
    RetryIntakeConsultationSchedulingController,
    ListIntakesController,
    ListIntakeResponsiblesController,
    GetIntakesController,
    ListClientIntakesController,
    TransitionIntakeStatusController,
    CloseIntakeWithoutContractController,
  ],
  exports: [IntakeMessagingModule],
})
export class IntakeModule {}
