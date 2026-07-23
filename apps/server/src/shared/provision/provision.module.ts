import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { envSchema, EnvProvider } from './env/env-provider'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
  ],
  providers: [EnvProvider],
  exports: [EnvProvider],
})
export class ProvisionModule {}
