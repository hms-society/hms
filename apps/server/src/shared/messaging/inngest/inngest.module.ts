import { Global, type DynamicModule, Module } from '@nestjs/common'

import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { InngestController } from '@/shared/messaging/inngest/inngest-controller'
import {
  INNGEST_OPTIONS,
  type InngestAsyncOptions,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'

@Global()
@Module({})
export class InngestModule {
  static forRoot(options: InngestOptions): DynamicModule {
    return {
      module: InngestModule,
      imports: [SharedMessagingModule],
      controllers: [InngestController],
      providers: [{ provide: INNGEST_OPTIONS, useValue: options }],
      exports: [INNGEST_OPTIONS],
    }
  }

  static forRootAsync(options: InngestAsyncOptions): DynamicModule {
    return {
      module: InngestModule,
      imports: [SharedMessagingModule, ...(options.imports ?? [])],
      controllers: [InngestController],
      providers: [
        {
          provide: INNGEST_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
      ],
      exports: [INNGEST_OPTIONS],
    }
  }
}
