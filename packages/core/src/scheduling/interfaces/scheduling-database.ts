import type { SchedulingDatabaseRepositories } from './scheduling-database-repositories'

export interface SchedulingDatabase {
  run<Result>(
    operation: (scope: SchedulingDatabaseRepositories) => Promise<Result>,
  ): Promise<Result>
}
