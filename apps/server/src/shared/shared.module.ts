import { Module } from '@nestjs/common'

import { SharedRestModule } from './rest/rest.module'

@Module({
  imports: [SharedRestModule],
})
export class SharedModule {}
