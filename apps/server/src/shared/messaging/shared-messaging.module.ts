import { Module } from '@nestjs/common'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [InngestClient],
  exports: [InngestClient],
})
export class SharedMessagingModule {}
