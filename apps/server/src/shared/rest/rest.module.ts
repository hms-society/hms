import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '../database/database.module'
import { CheckHealthController } from './controllers'

@Module({
  imports: [SharedDatabaseModule],
  controllers: [CheckHealthController],
})
export class SharedRestModule {}
