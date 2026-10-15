import { Injectable } from '@nestjs/common'
import type { AppointmentChange } from '@hms/core/scheduling/domain/entities'

import type { DrizzleAppointmentChange } from '@/scheduling/database/drizzle/types/entities'

@Injectable()
export class DrizzleAppointmentChangeMapper {
  toDomain(record: DrizzleAppointmentChange): AppointmentChange {
    return {
      id: record.id,
      appointmentId: record.appointmentId,
      kind: record.kind as AppointmentChange['kind'],
      actorId: record.actorId,
      occurredAt: record.occurredAt,
      previousScheduleId: record.previousScheduleId ?? undefined,
      newScheduleId: record.newScheduleId ?? undefined,
      previousStartsAt: record.previousStartsAt,
      previousEndsAt: record.previousEndsAt,
      newStartsAt: record.newStartsAt ?? undefined,
      newEndsAt: record.newEndsAt ?? undefined,
      previousRevision: record.previousRevision,
      resultingRevision: record.resultingRevision,
      publishedAt: record.publishedAt ?? undefined,
    }
  }
}
