import { Injectable } from '@nestjs/common'
import type {
  SchedulingDatabase,
  SchedulingDatabaseRepositories,
} from '@hms/core/scheduling/interfaces'
import { AppointmentConflictError } from '@hms/core/scheduling/domain/errors'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleAppointmentsRepository } from '@/scheduling/database/drizzle/repositories/drizzle-appointments-repository'
import { DrizzleSchedulesRepository } from '@/scheduling/database/drizzle/repositories/drizzle-schedules-repository'
import type { SchedulingDatabaseExecutor } from '@/scheduling/database/drizzle/repositories/scheduling-database-executor'

@Injectable()
export class DrizzleSchedulingDatabase implements SchedulingDatabase {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly transactionContext: DatabaseTransactionContext,
    private readonly appointmentsRepository: DrizzleAppointmentsRepository,
    private readonly schedulesRepository: DrizzleSchedulesRepository,
  ) {}

  run<Result>(
    operation: (scope: SchedulingDatabaseRepositories) => Promise<Result>,
  ): Promise<Result> {
    const activeTransaction = this.transactionContext.get()
    if (activeTransaction) return operation(this.scope(activeTransaction))
    return this.runWithRetry(operation, false)
  }

  private async runWithRetry<Result>(
    operation: (scope: SchedulingDatabaseRepositories) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient
        .requireDatabase()
        .transaction(
          (transaction) =>
            this.transactionContext.run(transaction, () =>
              operation(this.scope(transaction)),
            ),
          { isolationLevel: 'serializable', accessMode: 'read write' },
        )
    } catch (error) {
      if (!this.isRetryableConflict(error)) throw error
      if (hasRetried) throw new AppointmentConflictError()
      return this.runWithRetry(operation, true)
    }
  }

  private scope(database: SchedulingDatabaseExecutor): SchedulingDatabaseRepositories {
    return {
      appointmentsRepository: this.appointmentsRepository.withDatabase(database),
      schedulesRepository: this.schedulesRepository.withDatabase(database),
    }
  }

  private isRetryableConflict(error: unknown): boolean {
    let current: unknown = error
    while (current && typeof current === 'object') {
      if ('code' in current && (current.code === '40001' || current.code === '40P01'))
        return true
      if (!('cause' in current)) return false
      current = current.cause
    }
    return false
  }
}
