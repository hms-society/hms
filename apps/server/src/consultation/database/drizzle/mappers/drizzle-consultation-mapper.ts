import type { Consultation } from '@hms/core/consultation/domain/entities'
import type {
  ConsultationStatus,
  ConsultationModality,
  ConsultationSuggestionStatus,
  ConsultationSuggestionTarget,
} from '@hms/core/consultation/domain/structures'

import type { consultationModel } from '@/shared/database/drizzle/schema/consultation'

type ConsultationRecord = typeof consultationModel.$inferSelect & {
  assignedLawyer?: {
    id: string
    name?: string
    professionalName?: string
    email?: string
    [key: string]: any
  }
  intake?: {
    id: string
    sequenceNumber?: number
    origin?: string
    contactChannel?: string
    legalAreaId?: string
    legalTopicId?: string
    urgency?: string
    demandNotes?: string | null
    status?: string
    responsibleId?: string
    createdBy?: string
    attendantName?: string
    responsible?: {
      id: string
      name?: string
      professionalName?: string
      email?: string
      [key: string]: any
    }
    [key: string]: any
  }
  client?: {
    id: string
    type?: string
    name?: string | null
    legalName?: string | null
    tradeName?: string | null
    taxIdType?: string
    taxIdValue?: string
    phone?: string | null
    email?: string | null
    origin?: string | null
    linkedThirdParty?: string | null
    hmsResponsible?: string | null
    rg?: string | null
    birthDate?: string | null
    maritalStatus?: string | null
    nationality?: string | null
    profession?: string | null
    stateRegistration?: string | null
    constitutionDate?: string | null
    legalNature?: string | null
    legalRepresentative?: string | null
    representativeRole?: string | null
    zipCode?: string | null
    street?: string | null
    number?: string | null
    complement?: string | null
    district?: string | null
    city?: string | null
    state?: string | null
    [key: string]: any
  }
  legalArea?: {
    id: string
    name?: string
    [key: string]: any
  }
  legalTopic?: {
    id: string
    name?: string
    [key: string]: any
  }
  facts?: Array<{
    id: string
    description: string
    occurredOn: Date | null
  }>
  potentialRequests?: Array<{
    id: string
    description: string
    summary?: string | null
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
    const domainObject = {
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
      viability: (record as any).viability ?? undefined,
      decision: (record as any).decision ?? undefined,
      startedAt: record.startedAt ?? undefined,
      completedAt: record.completedAt ?? undefined,
      noShowAt: record.noShowAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,

      assignedLawyer: record.assignedLawyer
        ? {
            id: record.assignedLawyer.id,
            name:
              record.assignedLawyer.professionalName ??
              record.assignedLawyer.name ??
              'Não informado',
            email: record.assignedLawyer.email,
          }
        : undefined,
      attendant: record.intake?.responsible
        ? {
            id: record.intake.responsible.id,
            name:
              record.intake.responsible.professionalName ??
              record.intake.responsible.professional_name ??
              record.intake.responsible.name ??
              'Sistema',
            email: record.intake.responsible.email,
          }
        : undefined,

      intake: record.intake
        ? {
            id: record.intake.id,
            code: record.intake.sequenceNumber
              ? `INT-${String(record.intake.sequenceNumber).padStart(4, '0')}`
              : record.intake.code,
            origin: record.intake.origin,
            contactChannel: record.intake.contactChannel,
            legalAreaId: record.intake.legalAreaId,
            legalTopicId: record.intake.legalTopicId,
            urgency: record.intake.urgency,
            demandNotes: record.intake.demandNotes ?? undefined,
            status: record.intake.status,
            responsibleId: record.intake.responsibleId,
            createdBy: record.intake.createdBy,
            attendantName:
              record.intake.responsible?.professionalName ??
              record.intake.responsible?.name ??
              record.intake.attendantName,
          }
        : undefined,

      client: record.client
        ? {
            id: record.client.id,
            type: record.client.type,
            name: record.client.name ?? undefined,
            legalName: record.client.legalName ?? undefined,
            tradeName: record.client.tradeName ?? undefined,
            taxIdType: record.client.taxIdType,
            taxIdValue: record.client.taxIdValue,
            phone: record.client.phone ?? undefined,
            email: record.client.email ?? undefined,
            origin: record.client.origin ?? undefined,
            linkedThirdParty: record.client.linkedThirdParty ?? undefined,
            hmsResponsible: record.client.hmsResponsible ?? undefined,
            rg: record.client.rg ?? undefined,
            birthDate: record.client.birthDate ?? undefined,
            maritalStatus: record.client.maritalStatus ?? undefined,
            nationality: record.client.nationality ?? undefined,
            profession: record.client.profession ?? undefined,
            stateRegistration: record.client.stateRegistration ?? undefined,
            constitutionDate: record.client.constitutionDate ?? undefined,
            legalNature: record.client.legalNature ?? undefined,
            legalRepresentative: record.client.legalRepresentative ?? undefined,
            representativeRole: record.client.representativeRole ?? undefined,
            zipCode: record.client.zipCode ?? undefined,
            street: record.client.street ?? undefined,
            number: record.client.number ?? undefined,
            complement: record.client.complement ?? undefined,
            district: record.client.district ?? undefined,
            city: record.client.city ?? undefined,
            state: record.client.state ?? undefined,
          }
        : undefined,

      legalArea: record.legalArea
        ? {
            id: record.legalArea.id,
            name: record.legalArea.name,
          }
        : undefined,

      legalTopic: record.legalTopic
        ? {
            id: record.legalTopic.id,
            legalAreaId: record.legalTopic.legalAreaId,
            name: record.legalTopic.name,
          }
        : undefined,

      relevantFacts: (record.facts ?? []).map((fact) => ({
        id: fact.id,
        description: fact.description,
        occurredOn: fact.occurredOn ?? undefined,
      })),
      potentialLegalRequests: (record.potentialRequests ?? []).map((req) => ({
        id: req.id,
        description: req.description,
        summary: req.summary ?? undefined,
      })),
      identifiedRisks: (record.identifiedRisks ?? []).map((risk) => ({
        id: risk.id,
        description: risk.description,
      })),
      suggestions: (record.suggestions ?? []).map((sug) => ({
        id: sug.id,
        consultationId: record.id,
        target: sug.target as ConsultationSuggestionTarget,
        content: sug.content,
        status: sug.status as ConsultationSuggestionStatus,
        suggestedAt: sug.suggestedAt,
        reviewedAt: sug.reviewedAt ?? undefined,
        reviewedByCollaboratorId: sug.reviewedByCollaboratorId ?? undefined,
      })),
    }

    return domainObject as unknown as Consultation
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
      viability: (entity as any).viability ?? null,
      decision: (entity as any).decision ?? null,
      startedAt: entity.startedAt ?? null,
      completedAt: entity.completedAt ?? null,
      noShowAt: entity.noShowAt ?? null,
      updatedAt: entity.updatedAt,
    }
  }
}