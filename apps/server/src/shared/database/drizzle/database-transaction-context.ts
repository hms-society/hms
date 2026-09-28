import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable } from '@nestjs/common'

import type { Database } from '@/shared/database/drizzle/drizzle-client'
import type { PgTransaction } from 'drizzle-orm/pg-core'

export type DatabaseTransactionExecutor = Database | PgTransaction<any, any, any>

@Injectable()
export class DatabaseTransactionContext {
  private readonly storage = new AsyncLocalStorage<DatabaseTransactionExecutor>()

  get(): DatabaseTransactionExecutor | undefined {
    return this.storage.getStore()
  }

  run<Result>(
    transaction: DatabaseTransactionExecutor,
    operation: () => Promise<Result>,
  ) {
    if (this.storage.getStore()) return operation()
    return this.storage.run(transaction, operation)
  }
}
