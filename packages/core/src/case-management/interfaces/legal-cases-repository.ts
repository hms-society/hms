import type { LegalCase, LegalCaseCreation } from '../domain/entities'

export interface LegalCasesRepository {
  addMany(legalCases: readonly LegalCaseCreation[]): Promise<readonly LegalCase[]>
  removeAll(): Promise<void>
}
