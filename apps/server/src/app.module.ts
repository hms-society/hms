import { Module } from '@nestjs/common'

import { CommunicationModule } from './communication/communication.module'
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [SharedModule, CommunicationModule],
})
export class AppModule {}

