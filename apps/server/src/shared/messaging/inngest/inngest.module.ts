import { type DynamicModule, Module } from '@nestjs/common'

import {
  INNGEST_OPTIONS,
  type InngestAsyncOptions,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'
import { InngestController } from '@/shared/rest/controllers/inngest.controller'

@Module({})
export class InngestModule {
  static forRoot(options: InngestOptions): DynamicModule {
    return {
      module: InngestModule,
      controllers: [InngestController],
      providers: [{ provide: INNGEST_OPTIONS, useValue: options }],
    }
  }

  static forRootAsync(options: InngestAsyncOptions): DynamicModule {
    return {
      module: InngestModule,
      imports: options.imports,
      controllers: [InngestController],
      providers: [
        {
          provide: INNGEST_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
      ],
    }
  }
}
