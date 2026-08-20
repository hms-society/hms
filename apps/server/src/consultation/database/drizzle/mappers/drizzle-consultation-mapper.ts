import { Injectable } from '@nestjs/common'
import type { Consultation } from '@hms/core/consultation/domain/entities'

import type { DrizzleConsultation } from '@/consultation/database/drizzle/types'

@Injectable()
export class DrizzleConsultationMapper {
  toDomain(record: DrizzleConsultation): Consultation {
    return {
      ...record,
      appointmentId: record.appointmentId ?? undefined,
      legalAreaId: record.legalAreaId ?? undefined,
      legalTopicId: record.legalTopicId ?? undefined,
      primaryLegalQuestion: record.primaryLegalQuestion ?? undefined,
      guidanceProvided: record.guidanceProvided ?? undefined,
      notes: record.notes ?? undefined,
      channel: record.channel ?? undefined,
      modality: record.modality ?? undefined,
      startedAt: record.startedAt ?? undefined,
      completedAt: record.completedAt ?? undefined,
      noShowAt: record.noShowAt ?? undefined,
      dynamicFormId: record.dynamicFormId ?? undefined,
      dynamicFormAnswers: record.dynamicFormAnswers ?? [],
      dynamicFormSnapshot: record.dynamicFormSnapshot ?? undefined,
      viability: record.viability ?? undefined,
      decision: record.decision ?? undefined,
      attendanceFinalizedAt: record.attendanceFinalizedAt ?? undefined,
      attendanceFinalizedByCollaboratorId:
        record.attendanceFinalizedByCollaboratorId ?? undefined,
    } as Consultation
  }
}
