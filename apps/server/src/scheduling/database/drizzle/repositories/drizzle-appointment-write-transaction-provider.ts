import { Inject, Injectable } from '@nestjs/common'
import type { AppointmentWriteTransactionProvider } from '@hms/core/shared/interfaces'
import type { SchedulingDatabase } from '@hms/core/scheduling/interfaces'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'

class AppointmentScheduleChangedError extends Error {
  readonly code = '40001'

  constructor() {
    super('The appointment schedule changed while acquiring its lock.')
  }
}

@Injectable()
export class DrizzleAppointmentWriteTransactionProvider
  implements AppointmentWriteTransactionProvider
{
  constructor(
    @Inject(SCHEDULING_REPOSITORIES.database)
    private readonly database: SchedulingDatabase,
  ) {}

  async runWithLockedAppointment<Result>(
    appointmentId: string,
    operation: Parameters<
      AppointmentWriteTransactionProvider['runWithLockedAppointment']
    >[1],
  ): Promise<Result> {
    return this.database.run(async ({ appointmentsRepository, schedulesRepository }) => {
      const appointment = await appointmentsRepository.findById(appointmentId)
      if (!appointment) return operation(undefined) as Promise<Result>

      const schedule = await schedulesRepository.findByIdForUpdate(appointment.scheduleId)
      if (!schedule) return operation(undefined) as Promise<Result>

      const lockedAppointment =
        await appointmentsRepository.findByIdForUpdate(appointmentId)
      if (!lockedAppointment) return operation(undefined) as Promise<Result>
      if (lockedAppointment.scheduleId !== appointment.scheduleId) {
        throw new AppointmentScheduleChangedError()
      }

      return operation({
        appointmentId: lockedAppointment.id,
        status: lockedAppointment.status,
      }) as Promise<Result>
    })
  }
}
