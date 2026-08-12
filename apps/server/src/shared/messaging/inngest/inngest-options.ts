import type { FactoryProvider, ModuleMetadata } from '@nestjs/common'
import type { ServeHandlerOptions } from 'inngest'

export type InngestOptions = Pick<ServeHandlerOptions, 'client' | 'functions'>

export type InngestAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<InngestOptions>, 'inject' | 'useFactory'>

export const INNGEST_OPTIONS = Symbol('INNGEST_OPTIONS')
