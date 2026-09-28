import { Injectable } from '@nestjs/common'
import type { ConsultationOutboxEvent } from '@hms/core/consultation/domain/entities'

import type { DrizzleConsultationOutboxEvent } from '@/consultation/database/drizzle/types/entities'

@Injectable()
export class DrizzleConsultationOutboxEventMapper {
  toDomain(record: DrizzleConsultationOutboxEvent): ConsultationOutboxEvent {
    return {
      id: record.id,
      consultationId: record.consultationId,
      name: record.name as ConsultationOutboxEvent['name'],
      payload: record.payload,
      occurredAt: record.occurredAt,
      publishedAt: record.publishedAt ?? undefined,
    }
  }
}
