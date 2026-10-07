import { Injectable } from '@nestjs/common'
import type {
  CaseTask,
  CaseTaskCreation,
  CaseTaskReminderCreation,
  CaseTaskUpdate,
} from '@hms/core/case-management/domain/entities'
import type { CaseTasksRepository } from '@hms/core/case-management/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { asc, eq, inArray, isNull, sql, and } from 'drizzle-orm'

import {
  caseTaskAssigneeModel,
  caseTaskModel,
  caseTaskReminderModel,
} from '@/case-management/database/drizzle/models'
import { DrizzleCaseTaskMapper } from '@/case-management/database/drizzle/mappers'
import { DrizzleClient, type Database } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleCaseTasksRepository
  extends DrizzleRepository
  implements CaseTasksRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleCaseTaskMapper,
  ) {
    super(drizzle)
  }

  async add(caseTask: CaseTaskCreation): Promise<CaseTask> {
    const createdRecord = await this.database.transaction(async (transaction) => {
      const [record] = await transaction
        .insert(caseTaskModel)
        .values(this.toInsertValues(caseTask))
        .returning()

      if (!record) {
        throw new AppError('Não foi possível persistir a tarefa ou prazo.')
      }

      await this.insertAssignees(transaction, record.id, caseTask.assigneeIds)
      await this.insertReminders(transaction, record.id, caseTask.reminders)

      return record
    })

    return this.hydrate(createdRecord)
  }

  async findById(caseTaskId: string) {
    const [record] = await this.database
      .select()
      .from(caseTaskModel)
      .where(and(eq(caseTaskModel.id, caseTaskId), isNull(caseTaskModel.deletedAt)))
      .limit(1)

    return record ? this.hydrate(record) : undefined
  }

  async listByCaseId(caseId: string) {
    const records = await this.database
      .select()
      .from(caseTaskModel)
      .where(and(eq(caseTaskModel.caseId, caseId), isNull(caseTaskModel.deletedAt)))
      .orderBy(asc(caseTaskModel.plannedDate), asc(caseTaskModel.createdAt))

    return this.hydrateMany(records)
  }

  async replace(
    caseTaskId: string,
    changes: CaseTaskUpdate,
    expectedVersion: number,
    updatedAt: Date,
  ) {
    const updatedRecord = await this.database.transaction(async (transaction) => {
      const { assigneeIds, reminders, ...taskChanges } = changes
      const [record] = await transaction
        .update(caseTaskModel)
        .set({
          ...this.removeUndefined(taskChanges),
          updatedAt,
          version: sql`${caseTaskModel.version} + 1`,
        })
        .where(
          and(
            eq(caseTaskModel.id, caseTaskId),
            eq(caseTaskModel.version, expectedVersion),
            isNull(caseTaskModel.deletedAt),
          ),
        )
        .returning()

      if (!record) return undefined

      if (assigneeIds) {
        await transaction
          .delete(caseTaskAssigneeModel)
          .where(eq(caseTaskAssigneeModel.caseTaskId, caseTaskId))
        await this.insertAssignees(transaction, caseTaskId, assigneeIds)
      }

      if (reminders) {
        await transaction
          .delete(caseTaskReminderModel)
          .where(eq(caseTaskReminderModel.caseTaskId, caseTaskId))
        await this.insertReminders(transaction, caseTaskId, reminders)
      }

      return record
    })

    return updatedRecord ? this.hydrate(updatedRecord) : undefined
  }

  async remove(
    caseTaskId: string,
    expectedVersion: number,
    deletedAt: Date,
    updatedAt: Date,
  ) {
    const [record] = await this.database
      .update(caseTaskModel)
      .set({ deletedAt, updatedAt, version: sql`${caseTaskModel.version} + 1` })
      .where(
        and(
          eq(caseTaskModel.id, caseTaskId),
          eq(caseTaskModel.version, expectedVersion),
          isNull(caseTaskModel.deletedAt),
        ),
      )
      .returning()

    return record ? this.hydrate(record) : undefined
  }

  async removeAll() {
    await this.database.delete(caseTaskReminderModel)
    await this.database.delete(caseTaskAssigneeModel)
    await this.database.delete(caseTaskModel)
  }

  private async hydrate(record: typeof caseTaskModel.$inferSelect) {
    const [task] = await this.hydrateMany([record])
    if (!task) throw new AppError('Não foi possível ler a tarefa ou prazo.')
    return task
  }

  private async hydrateMany(records: readonly (typeof caseTaskModel.$inferSelect)[]) {
    if (records.length === 0) return []

    const caseTaskIds = records.map((record) => record.id)
    const [assignees, reminders] = await Promise.all([
      this.database
        .select({
          caseTaskId: caseTaskAssigneeModel.caseTaskId,
          collaboratorId: caseTaskAssigneeModel.collaboratorId,
        })
        .from(caseTaskAssigneeModel)
        .where(inArray(caseTaskAssigneeModel.caseTaskId, caseTaskIds)),
      this.database
        .select()
        .from(caseTaskReminderModel)
        .where(inArray(caseTaskReminderModel.caseTaskId, caseTaskIds)),
    ])

    const assigneeIdsByTask = new Map<string, string[]>()
    for (const assignee of assignees) {
      const taskAssigneeIds = assigneeIdsByTask.get(assignee.caseTaskId) ?? []
      taskAssigneeIds.push(assignee.collaboratorId)
      assigneeIdsByTask.set(assignee.caseTaskId, taskAssigneeIds)
    }

    const remindersByTask = new Map<
      string,
      ReturnType<DrizzleCaseTaskMapper['toReminderDomain']>[]
    >()
    for (const reminder of reminders) {
      const taskReminders = remindersByTask.get(reminder.caseTaskId) ?? []
      taskReminders.push(this.mapper.toReminderDomain(reminder))
      remindersByTask.set(reminder.caseTaskId, taskReminders)
    }

    return records.map((record) =>
      this.mapper.toDomain(
        record,
        assigneeIdsByTask.get(record.id) ?? [],
        remindersByTask.get(record.id) ?? [],
      ),
    )
  }

  private toInsertValues(caseTask: CaseTaskCreation) {
    return {
      caseId: caseTask.caseId,
      type: caseTask.type,
      title: caseTask.title,
      customType: caseTask.customType,
      description: caseTask.description,
      plannedDate: caseTask.plannedDate,
      plannedTime: caseTask.plannedTime,
      status: caseTask.status,
      createdById: caseTask.createdById,
      source: caseTask.source,
      blocksCaseClosure: caseTask.blocksCaseClosure,
      completionNote: caseTask.completionNote,
      completedAt: caseTask.completedAt,
      completedById: caseTask.completedById,
      lastReminderAt: caseTask.lastReminderAt,
    }
  }

  private async insertAssignees(
    database: Database,
    caseTaskId: string,
    collaboratorIds: readonly string[],
  ) {
    if (collaboratorIds.length === 0) return
    await database
      .insert(caseTaskAssigneeModel)
      .values(collaboratorIds.map((collaboratorId) => ({ caseTaskId, collaboratorId })))
  }

  private async insertReminders(
    database: Database,
    caseTaskId: string,
    reminders: readonly CaseTaskReminderCreation[],
  ) {
    if (reminders.length === 0) return
    await database.insert(caseTaskReminderModel).values(
      reminders.map((reminder) => ({
        caseTaskId,
        value: reminder.value,
        unit: reminder.unit,
      })),
    )
  }

  private removeUndefined<T extends Record<string, unknown>>(values: T) {
    return Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined),
    ) as Partial<T>
  }
}
