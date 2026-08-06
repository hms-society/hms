import type { Consultation } from '@hms/core/consultation/domain/entities'
import type {
  ConsultationStatus,
  ConsultationModality,
  ConsultationSuggestionStatus,
  ConsultationSuggestionTarget,
} from '@hms/core/consultation/domain/structures'

import type { consultationModel } from '@/shared/database/drizzle/schema/consultation'

type ConsultationRecord = typeof consultationModel.$inferSelect & {
  facts?: Array<{
    id: string
    description: string
    occurredOn: Date | null
  }>
  potentialRequests?: Array<{
    id: string
    description: string
  }>
  identifiedRisks?: Array<{
    id: string
    description: string
  }>
  suggestions?: Array<{
    id: string
    target: string
    content: string
    status: string
    suggestedAt: Date
    reviewedAt: Date | null
    reviewedByCollaboratorId: string | null
  }>
}

export class DrizzleConsultationMapper {
  static toDomain(record: ConsultationRecord): Consultation {
    return {
      id: record.id,
      appointmentId: record.appointmentId,
      clientId: record.clientId,
      assignedLawyerId: record.assignedLawyerId,
      legalAreaId: record.legalAreaId,
      legalTopicId: record.legalTopicId,
      status: record.status as ConsultationStatus,
      modality: record.modality as ConsultationModality,
      channel: record.channel ?? undefined,
      primaryLegalQuestion: record.primaryLegalQuestion ?? undefined,
      guidanceProvided: record.guidanceProvided ?? undefined,
      notes: record.notes ?? undefined,
      startedAt: record.startedAt ?? undefined,
      completedAt: record.completedAt ?? undefined,
      noShowAt: record.noShowAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      relevantFacts: (record.facts ?? []).map((fact) => ({
        id: fact.id,
        description: fact.description,
        occurredOn: fact.occurredOn ?? undefined,
      })),
      potentialLegalRequests: (record.potentialRequests ?? []).map((req) => ({
        id: req.id,
        description: req.description,
      })),
      identifiedRisks: (record.identifiedRisks ?? []).map((risk) => ({
        id: risk.id,
        description: risk.description,
      })),
      suggestions: (record.suggestions ?? []).map((sug) => ({
        id: sug.id,
        target: sug.target as ConsultationSuggestionTarget,
        content: sug.content,
        status: sug.status as ConsultationSuggestionStatus,
        suggestedAt: sug.suggestedAt,
        reviewedAt: sug.reviewedAt ?? undefined,
        reviewedByCollaboratorId: sug.reviewedByCollaboratorId ?? undefined,
      })),
    } as Consultation
  }

  static toPersistence(entity: Consultation) {
    return {
      id: entity.id,
      appointmentId: entity.appointmentId,
      clientId: entity.clientId,
      assignedLawyerId: entity.assignedLawyerId,
      legalAreaId: entity.legalAreaId,
      legalTopicId: entity.legalTopicId,
      status: entity.status,
      modality: entity.modality,
      channel: entity.channel ?? null,
      primaryLegalQuestion: entity.primaryLegalQuestion ?? null,
      guidanceProvided: entity.guidanceProvided ?? null,
      notes: entity.notes ?? null,
      startedAt: entity.startedAt ?? null,
      completedAt: entity.completedAt ?? null,
      noShowAt: entity.noShowAt ?? null,
      updatedAt: entity.updatedAt,
    }
  }
}