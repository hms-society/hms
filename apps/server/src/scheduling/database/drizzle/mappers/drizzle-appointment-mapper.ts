import { Injectable } from '@nestjs/common'
import type { Appointment } from '@hms/core/scheduling/domain/entities'

import type { DrizzleAppointment } from '@/scheduling/database/drizzle/types'

@Injectable()
export class DrizzleAppointmentMapper {
  toDomain(record: DrizzleAppointment): Appointment {
    return {
      ...record,
      status: record.status as Appointment['status'],
      cancelledAt: record.cancelledAt ?? undefined,
    }
  }
}
