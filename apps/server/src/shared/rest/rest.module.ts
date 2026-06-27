import { Module } from '@nestjs/common'

import { CheckHealthController } from './controllers'

@Module({
  controllers: [CheckHealthController],
})
export class SharedRestModule {}
