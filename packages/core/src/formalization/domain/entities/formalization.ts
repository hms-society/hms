import type {
  DynamicFormAnswer,
  DynamicFormSnapshot,
} from '../../../shared/domain/structures'
import type { Entity } from '../../../shared/domain/entities/entity'
import type {
  FormalizationContractFormState,
  FormalizationSignatureRequestStatus,
  FormalizationStatus,
} from '../structures'

export type Formalization = Entity & {
  intakeId: string
  clientId: string
  consultationId: string
  assignedLawyerId: string
  legalAreaId?: string
  legalTopicId?: string
  status: FormalizationStatus
  contractFormId: string
  contractFormSnapshot: DynamicFormSnapshot
  contractFormAnswers: DynamicFormAnswer[]
  contractFormState: FormalizationContractFormState
  contractFormRevision: number
  contractFormClosedAt?: Date
  contractFormClosedByCollaboratorId?: string
  documentsConfirmedAt?: Date
  documentsConfirmedByCollaboratorId?: string
  documentsConfirmedRevision?: number
  signatureRequestId?: string
  signatureStatus?: FormalizationSignatureRequestStatus
  signatureSubmittedAt?: Date
  signatureConfirmedAt?: Date
  signatureTerminalAt?: Date
  completedAt?: Date
  completedByCollaboratorId?: string
  contractingConfirmationKey?: string
  cancelledAt?: Date
  cancelledByCollaboratorId?: string
  version: number
  createdAt: Date
  updatedAt: Date
}
