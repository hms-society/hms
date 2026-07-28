import type { Provider } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle-client'

export const DRIZZLE = 'DRIZZLE'
export type DrizzleDB = ReturnType<DrizzleClient['requireDatabase']>

export const databaseProviders: Provider[] = [
  {
    provide: DRIZZLE,
    useFactory: (drizzleClient: DrizzleClient) => drizzleClient.requireDatabase(),
    inject: [DrizzleClient],
  },
]
