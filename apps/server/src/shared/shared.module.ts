import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { SharedDatabaseModule } from './database/database.module'
import { SharedRestModule } from './rest/rest.module'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SharedDatabaseModule, SharedRestModule],
  exports: [SharedDatabaseModule, SharedRestModule],
})
export class SharedModule {}

