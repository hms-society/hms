import type { CaseTask, CaseTaskCreation, CaseTaskUpdate } from '../domain/entities'

export interface CaseTasksRepository {
  add(caseTask: CaseTaskCreation): Promise<CaseTask>
  findById(caseTaskId: string): Promise<CaseTask | undefined>
  listByCaseId(caseId: string): Promise<readonly CaseTask[]>
  replace(
    caseTaskId: string,
    changes: CaseTaskUpdate,
    expectedVersion: number,
    updatedAt: Date,
  ): Promise<CaseTask | undefined>
  remove(
    caseTaskId: string,
    expectedVersion: number,
    deletedAt: Date,
    updatedAt: Date,
  ): Promise<CaseTask | undefined>
  removeAll(): Promise<void>
}
