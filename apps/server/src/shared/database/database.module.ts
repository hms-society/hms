import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseProviders, DRIZZLE } from './database.provider'
import { DatabaseService } from './database.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [...databaseProviders, DatabaseService],
  exports: [DRIZZLE, DatabaseService],
})
export class SharedDatabaseModule {}
