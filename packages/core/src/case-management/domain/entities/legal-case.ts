import type { Entity } from '#shared/domain/entities/entity'
import type { LegalCaseStatus } from '../structures'

export type LegalCase = Entity & {
  publicCode: string
  clientId: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  title: string
  status: LegalCaseStatus
  openedAt: Date
  version: number
  createdAt: Date
  updatedAt: Date
}

export type LegalCaseCreation = Omit<
  LegalCase,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>
