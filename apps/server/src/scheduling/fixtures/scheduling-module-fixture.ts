import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class SchedulingModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly schedulesRepository: SchedulesRepository,
    readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  static async register() {
    const restFixture = await RestFixture.register({
      imports: [SchedulingDatabaseModule],
    })
    return new SchedulingModuleFixture(
      restFixture,
      restFixture.get(SCHEDULING_REPOSITORIES.schedules),
      restFixture.get(SCHEDULING_REPOSITORIES.appointments),
    )
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}
