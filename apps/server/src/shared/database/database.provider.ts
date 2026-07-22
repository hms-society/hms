import type { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

export const DRIZZLE = 'DRIZZLE'
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>

export const databaseProviders: Provider[] = [
  {
    provide: DRIZZLE,
    useFactory: (configService: ConfigService) => {
      const connectionString =
        configService.get<string>('DATABASE_URL') ||
        'postgresql://postgres:postgres@localhost:5433/postgres'
      const client = postgres(connectionString)
      return drizzle(client, { schema })
    },
    inject: [ConfigService],
  },
]