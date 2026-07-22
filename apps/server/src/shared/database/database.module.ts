import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseProviders, DRIZZLE } from './database.provider'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [...databaseProviders],
  exports: [DRIZZLE],
})
export class SharedDatabaseModule {}