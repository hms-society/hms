import { Injectable } from '@nestjs/common'
import type {
  CaseClosureBlocker,
  CaseClosureSnapshot,
} from '@hms/core/case-management/domain/structures'
import type { CaseClosureRepository } from '@hms/core/case-management/interfaces'
import { and, desc, eq, isNull, ne, or } from 'drizzle-orm'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

import {
  caseChecklistItemModel,
  caseClosureEventModel,
  caseTaskModel,
  legalCaseModel,
} from '@/case-management/database/drizzle/models'
import {
  DrizzleCaseClosureEventMapper,
  DrizzleLegalCaseMapper,
} from '@/case-management/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

type CaseManagementTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]

@Injectable()
export class DrizzleCaseClosureRepository
  extends DrizzleRepository
  implements CaseClosureRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly legalCaseMapper: DrizzleLegalCaseMapper,
    private readonly eventMapper: DrizzleCaseClosureEventMapper,
  ) {
    super(drizzle)
  }

  async getSnapshot(caseId: string): Promise<CaseClosureSnapshot | undefined> {
    return this.drizzleClient.requireDatabase().transaction(
      async (transaction) => {
        const [record] = await transaction
          .select()
          .from(legalCaseModel)
          .where(eq(legalCaseModel.id, caseId))
          .limit(1)
        if (!record) return undefined

        const blockers = await this.findBlockers(transaction, caseId)
        const events = await this.findEvents(transaction, caseId)
        return {
          legalCase: this.legalCaseMapper.toDomain(record),
          closure:
            record.closureOutcome && record.closedAt && record.closedBy
              ? {
                  outcome: record.closureOutcome,
                  notes: record.closureNotes ?? undefined,
                  closedBy: record.closedBy,
                  closedAt: record.closedAt,
                }
              : undefined,
          blockers,
          events,
        }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }

  async close(
    params: Parameters<CaseClosureRepository['close']>[0],
  ): ReturnType<CaseClosureRepository['close']> {
    try {
      return await this.drizzleClient.requireDatabase().transaction(
        async (transaction) => {
          const [currentCase] = await transaction
            .select()
            .from(legalCaseModel)
            .where(eq(legalCaseModel.id, params.caseId))
            .for('update')
            .limit(1)
          if (currentCase?.lifecycleStatus !== 'active') {
            return { kind: 'conflict' }
          }

          const blockers = await this.findBlockers(transaction, params.caseId)
          if (blockers.length > 0) return { kind: 'blocked', blockers }

          const [closedCase] = await transaction
            .update(legalCaseModel)
            .set({
              lifecycleStatus: 'closed',
              closureOutcome: params.outcome,
              closureNotes: params.notes ?? null,
              closedAt: params.occurredAt,
              closedBy: params.actorId,
              updatedAt: params.occurredAt,
            })
            .where(
              and(
                eq(legalCaseModel.id, params.caseId),
                eq(legalCaseModel.lifecycleStatus, 'active'),
              ),
            )
            .returning()
          if (!closedCase) return { kind: 'conflict' }

          const [event] = await transaction
            .insert(caseClosureEventModel)
            .values({
              caseId: params.caseId,
              type: 'closed',
              actorId: params.actorId,
              occurredAt: params.occurredAt,
              outcome: params.outcome,
              notes: params.notes ?? null,
            })
            .returning()
          if (!event) throw new Error('Could not persist the case closure event.')

          return {
            kind: 'closed',
            legalCase: this.legalCaseMapper.toDomain(closedCase),
            closure: {
              outcome: params.outcome,
              notes: params.notes,
              closedBy: params.actorId,
              closedAt: params.occurredAt,
            },
            event: this.eventMapper.toDomain(event),
          }
        },
        { isolationLevel: 'serializable', accessMode: 'read write' },
      )
    } catch (error) {
      if (this.isSerializationConflict(error)) return { kind: 'conflict' }
      throw error
    }
  }

  async reopen(
    params: Parameters<CaseClosureRepository['reopen']>[0],
  ): ReturnType<CaseClosureRepository['reopen']> {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      await transaction
        .select({ id: legalCaseModel.id })
        .from(legalCaseModel)
        .where(eq(legalCaseModel.id, params.caseId))
        .for('update')
        .limit(1)

      const [reopenedCase] = await transaction
        .update(legalCaseModel)
        .set({ lifecycleStatus: 'active', updatedAt: params.occurredAt })
        .where(
          and(
            eq(legalCaseModel.id, params.caseId),
            eq(legalCaseModel.lifecycleStatus, 'closed'),
          ),
        )
        .returning()
      if (!reopenedCase) return undefined

      const [event] = await transaction
        .insert(caseClosureEventModel)
        .values({
          caseId: params.caseId,
          type: 'reopened',
          actorId: params.actorId,
          occurredAt: params.occurredAt,
          reason: params.reason,
        })
        .returning()
      if (!event) throw new Error('Could not persist the case reopening event.')

      return this.legalCaseMapper.toDomain(reopenedCase)
    })
  }

  async listEvents(caseId: string) {
    return this.findEvents(this.database, caseId)
  }

  private async findEvents(
    database: Database | CaseManagementTransaction,
    caseId: string,
  ) {
    const events = await database
      .select()
      .from(caseClosureEventModel)
      .where(eq(caseClosureEventModel.caseId, caseId))
      .orderBy(desc(caseClosureEventModel.occurredAt), desc(caseClosureEventModel.id))
    return events.map((event) => this.eventMapper.toDomain(event))
  }

  private async findBlockers(
    database: CaseManagementTransaction,
    caseId: string,
  ): Promise<CaseClosureBlocker[]> {
    const openTasks = await database
      .select()
      .from(caseTaskModel)
      .where(
        and(
          eq(caseTaskModel.caseId, caseId),
          isNull(caseTaskModel.deletedAt),
          ne(caseTaskModel.status, 'completed'),
          or(
            eq(caseTaskModel.type, 'process_deadline'),
            and(
              eq(caseTaskModel.type, 'internal_task'),
              eq(caseTaskModel.blocksCaseClosure, true),
            ),
          ),
        ),
      )
    const requiredItems = await database
      .select()
      .from(caseChecklistItemModel)
      .where(
        and(
          eq(caseChecklistItemModel.caseId, caseId),
          eq(caseChecklistItemModel.isRequired, true),
          ne(caseChecklistItemModel.status, 'validated'),
        ),
      )

    const taskBlockers: CaseClosureBlocker[] = openTasks.map((task) => ({
      id: task.id,
      kind: task.type === 'process_deadline' ? 'legal_deadline' : 'blocking_task',
      title: task.title,
      description: task.description,
      section: task.type === 'process_deadline' ? 'deadlines' : 'tasks',
      href: `/advogado/meus-casos/${caseId}?tab=prazos&taskId=${task.id}`,
    }))
    const checklistBlockers: CaseClosureBlocker[] = requiredItems.map((item) => ({
      id: item.id,
      kind: 'required_checklist_item',
      title: item.title,
      description: 'Este item obrigatório ainda não foi validado.',
      section: 'checklist',
      href: `/advogado/meus-casos/${caseId}?tab=checklist&itemId=${item.id}`,
    }))

    return [...taskBlockers, ...checklistBlockers]
  }

  private isSerializationConflict(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '40001'
    )
  }
}
