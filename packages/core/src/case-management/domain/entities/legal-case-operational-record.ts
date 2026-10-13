import type { LegalCase } from './legal-case'

export type LegalCaseOperationalRecord = Pick<
  LegalCase,
  | 'id'
  | 'publicCode'
  | 'title'
  | 'status'
  | 'clientId'
  | 'legalAreaId'
  | 'legalTopicId'
  | 'updatedAt'
> & {
  readonly managerCollaboratorIds: readonly string[]
}
