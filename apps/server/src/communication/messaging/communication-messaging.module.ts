import { Module } from '@nestjs/common'

import {
  ProcessWhatsappEventJob,
  SendFormalizationSignatureInvitationJob,
  SendFormalizationSignatureOtpJob,
} from '@/communication/messaging/inngest/jobs'
import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import {
  FormalizationSignatureEmailDeliveryProvider,
  ResendEmailProvider,
} from '@/communication/provision'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const COMMUNICATION_INNGEST_FUNCTIONS = Symbol('COMMUNICATION_INNGEST_FUNCTIONS')

@Module({
  imports: [
    FormalizationDatabaseModule,
    FormalizationProvisionModule,
    IdentityModule,
    ProvisionModule,
    SharedDatabaseModule,
    SharedMessagingModule,
  ],
  providers: [
    ProcessWhatsappEventJob,
    ResendEmailProvider,
    {
      provide: COMMUNICATION_PROVIDERS.email,
      useExisting: ResendEmailProvider,
    },
    FormalizationSignatureEmailDeliveryProvider,
    SendFormalizationSignatureInvitationJob,
    SendFormalizationSignatureOtpJob,
    {
      provide: COMMUNICATION_INNGEST_FUNCTIONS,
      inject: [
        ProcessWhatsappEventJob,
        SendFormalizationSignatureInvitationJob,
        SendFormalizationSignatureOtpJob,
      ],
      useFactory: (
        whatsappJob: ProcessWhatsappEventJob,
        invitationJob: SendFormalizationSignatureInvitationJob,
        otpJob: SendFormalizationSignatureOtpJob,
      ): InngestFunctionGroup => [
        whatsappJob.function,
        invitationJob.function,
        otpJob.function,
      ],
    },
  ],
  exports: [
    ProcessWhatsappEventJob,
    SendFormalizationSignatureInvitationJob,
    SendFormalizationSignatureOtpJob,
    COMMUNICATION_INNGEST_FUNCTIONS,
  ],
})
export class CommunicationMessagingModule {}
