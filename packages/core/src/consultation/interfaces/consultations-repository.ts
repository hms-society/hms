import type { Consultation } from '../domain/entities'

export type ConsultationUpdate = Partial<
  Pick<
    Consultation,
    | 'legalAreaId'
    | 'legalTopicId'
    | 'primaryLegalQuestion'
    | 'guidanceProvided'
    | 'notes'
    | 'relevantFacts'
    | 'potentialLegalRequests'
    | 'identifiedRisks'
    | 'viability'
    | 'decision'
    | 'dynamicFormId'
    | 'dynamicFormAnswers'
    | 'dynamicFormSnapshot'
    | 'status'
    | 'completedAt'
  >
> & {
  attendanceFinalizedAt?: Date | null
  attendanceFinalizedByCollaboratorId?: string | null
}

export interface ConsultationsRepository {
  add(consultation: Consultation): Promise<Consultation>
  addMany(consultations: readonly Consultation[]): Promise<readonly Consultation[]>
  findById(consultationId: string): Promise<Consultation | undefined>
  findByIntakeId(intakeId: string): Promise<Consultation | undefined>
  replace(
    consultationId: string,
    changes: ConsultationUpdate,
  ): Promise<Consultation | undefined>
  removeAll(): Promise<void>
}
