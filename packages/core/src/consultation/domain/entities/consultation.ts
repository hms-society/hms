import type {
  ConsultationChannel,
  ConsultationFormResponse,
  ConsultationModality,
  ConsultationStatus,
} from '../structures'
import type { IdentifiedRisk } from './identified-risk'
import type { PotentialLegalRequest } from './potential-legal-request'
import type { RelevantFact } from './relevant-fact'
import type { ConsultationSuggestion } from './consultation-suggestion'

type ConsultationBase = {
  id: string
  intakeId?: string
  appointmentId: string
  clientId: string
  assignedLawyerId: string
  legalAreaId: string
  legalTopicId: string
  primaryLegalQuestion?: string
  guidanceProvided?: string
  notes?: string
  relevantFacts: RelevantFact[]
  potentialLegalRequests: PotentialLegalRequest[]
  identifiedRisks: IdentifiedRisk[]
  suggestions: ConsultationSuggestion[]
  formTemplateId?: string
  formResponses: ConsultationFormResponse[]
  createdAt: Date
  updatedAt: Date
}

type InPersonConsultation = {
  modality: typeof ConsultationModality.InPerson
  channel?: never
}

type VirtualConsultation = {
  modality: typeof ConsultationModality.Virtual
  channel: ConsultationChannel
}

type PendingConsultation = {
  status: typeof ConsultationStatus.Pending
  startedAt?: never
  completedAt?: never
  noShowAt?: never
}

type ConsultationInProgress = {
  status: typeof ConsultationStatus.InProgress
  startedAt: Date
  completedAt?: never
  noShowAt?: never
}

type CompletedConsultation = {
  status: typeof ConsultationStatus.Completed
  primaryLegalQuestion: string
  guidanceProvided: string
  startedAt: Date
  completedAt: Date
  noShowAt?: never
}

type NoShowConsultation = {
  status: typeof ConsultationStatus.NoShow
  startedAt?: never
  completedAt?: never
  noShowAt: Date
}

type ConsultationAttendance = InPersonConsultation | VirtualConsultation

type ConsultationLifecycle =
  | PendingConsultation
  | ConsultationInProgress
  | CompletedConsultation
  | NoShowConsultation

export type Consultation = ConsultationBase &
  ConsultationAttendance &
  ConsultationLifecycle
