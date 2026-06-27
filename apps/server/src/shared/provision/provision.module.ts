import { Module } from '@nestjs/common'

import { EnvProvider } from './env/env-provider'

@Module({
  providers: [EnvProvider],
})
export class ProvisionModule {}
