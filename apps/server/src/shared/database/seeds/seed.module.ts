import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '../database.module'
import { ParametroSistemaSeed } from './parametro-sistema.seed'

@Module({
  imports: [SharedDatabaseModule],
  providers: [ParametroSistemaSeed],
  exports: [ParametroSistemaSeed],
})
export class SeedModule {}
