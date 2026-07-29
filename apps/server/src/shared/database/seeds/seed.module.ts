import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '../database.module'
import { ParametroSistemaSeed } from './parametro-sistema.seed'
import { usuarioSeed } from './usuario.seed'

@Module({
  imports: [SharedDatabaseModule],
  providers: [ParametroSistemaSeed, usuarioSeed],
  exports: [ParametroSistemaSeed, usuarioSeed],
})
export class SeedModule {}
