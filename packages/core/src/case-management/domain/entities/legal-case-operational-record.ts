import type { LegalCase } from './legal-case'
import type { LegalCaseStatus } from '../structures'

export type LegalCaseOperationalRecord = Pick<
  LegalCase,
  | 'id'
  | 'publicCode'
  | 'title'
  | 'clientId'
  | 'legalAreaId'
  | 'legalTopicId'
  | 'updatedAt'
> & {
  status: LegalCaseStatus
  readonly managerCollaboratorIds: readonly string[]
}
