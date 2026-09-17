import { Injectable } from '@nestjs/common'
import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type {
  DynamicFormListQuery,
  DynamicFormListResult,
} from '@hms/core/legal-catalog/domain/structures'
import { DynamicFormNameConflictError } from '@hms/core/legal-catalog/domain/errors'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'
import { and, asc, countDistinct, eq, ilike, inArray, sql, type SQL } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import {
  dynamicFormAdministrationAuditModel,
  dynamicFormLegalTopicModel,
  dynamicFormModel,
  dynamicFormOperationModel,
  legalAreaModel,
  legalTopicModel,
} from '@/legal-catalog/database/drizzle/models'
import { DynamicFormMapper } from '@/legal-catalog/database/drizzle/mappers'

type DynamicFormReplacement = Parameters<
  DynamicFormAdministrationRepository['replace']
>[1]

@Injectable()
export class DrizzleDynamicFormAdministrationRepository
  extends DrizzleRepository
  implements DynamicFormAdministrationRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly dynamicFormMapper: DynamicFormMapper,
  ) {
    super(drizzle)
  }

  async list(query: DynamicFormListQuery): Promise<DynamicFormListResult> {
    const filters = this.buildFilters(query)
    const [{ total }] = await this.database
      .select({ total: countDistinct(dynamicFormModel.id) })
      .from(dynamicFormModel)
      .innerJoin(legalAreaModel, eq(dynamicFormModel.legalAreaId, legalAreaModel.id))
      .where(filters)

    const formRows = await this.database
      .select({ form: dynamicFormModel, area: legalAreaModel })
      .from(dynamicFormModel)
      .innerJoin(legalAreaModel, eq(dynamicFormModel.legalAreaId, legalAreaModel.id))
      .where(filters)
      .orderBy(asc(dynamicFormModel.normalizedName), asc(dynamicFormModel.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)

    const formIds = formRows.map(({ form }) => form.id)
    const rows = formIds.length
      ? await this.database
          .select({
            form: dynamicFormModel,
            area: legalAreaModel,
            formTopic: dynamicFormLegalTopicModel,
            topic: legalTopicModel,
          })
          .from(dynamicFormModel)
          .innerJoin(legalAreaModel, eq(dynamicFormModel.legalAreaId, legalAreaModel.id))
          .leftJoin(
            dynamicFormLegalTopicModel,
            eq(dynamicFormLegalTopicModel.dynamicFormId, dynamicFormModel.id),
          )
          .leftJoin(
            legalTopicModel,
            eq(dynamicFormLegalTopicModel.legalTopicId, legalTopicModel.id),
          )
          .where(inArray(dynamicFormModel.id, formIds))
          .orderBy(
            asc(dynamicFormModel.normalizedName),
            asc(dynamicFormModel.id),
            asc(dynamicFormLegalTopicModel.position),
          )
      : []

    const items = this.groupRows(rows).map(({ form, area, topics }) =>
      this.dynamicFormMapper.toListItem(form, area, topics),
    )

    return {
      items,
      page: query.page,
      pageSize: 5,
      total: Number(total),
      pageCount: Math.ceil(Number(total) / query.pageSize),
    }
  }

  async findById(id: string): Promise<DynamicForm | null> {
    const rows = await this.database
      .select({
        form: dynamicFormModel,
        formTopic: dynamicFormLegalTopicModel,
        topic: legalTopicModel,
      })
      .from(dynamicFormModel)
      .leftJoin(
        dynamicFormLegalTopicModel,
        eq(dynamicFormLegalTopicModel.dynamicFormId, dynamicFormModel.id),
      )
      .leftJoin(
        legalTopicModel,
        eq(dynamicFormLegalTopicModel.legalTopicId, legalTopicModel.id),
      )
      .where(eq(dynamicFormModel.id, id))

    const [record] = rows
    if (!record) return null

    return this.dynamicFormMapper.toDomain(
      record.form,
      rows.flatMap(({ formTopic, topic }) =>
        formTopic ? [{ ...formTopic, topic }] : [],
      ),
    )
  }

  async findByNormalizedName(normalizedName: string): Promise<DynamicForm | null> {
    const rows = await this.database
      .select({
        form: dynamicFormModel,
        formTopic: dynamicFormLegalTopicModel,
        topic: legalTopicModel,
      })
      .from(dynamicFormModel)
      .leftJoin(
        dynamicFormLegalTopicModel,
        eq(dynamicFormLegalTopicModel.dynamicFormId, dynamicFormModel.id),
      )
      .leftJoin(
        legalTopicModel,
        eq(dynamicFormLegalTopicModel.legalTopicId, legalTopicModel.id),
      )
      .where(eq(dynamicFormModel.normalizedName, normalizedName))

    const [record] = rows
    if (!record) return null

    return this.dynamicFormMapper.toDomain(
      record.form,
      rows.flatMap(({ formTopic, topic }) =>
        formTopic ? [{ ...formTopic, topic }] : [],
      ),
    )
  }

  async add(form: DynamicForm): Promise<void> {
    const [inserted] = await this.database
      .insert(dynamicFormModel)
      .values({
        id: form.id,
        name: form.name,
        normalizedName: form.normalizedName,
        description: form.description,
        status: form.status,
        stage: form.stage,
        legalAreaId: form.legalAreaId,
        fields: form.fields,
        version: form.version,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      })
      .onConflictDoNothing({ target: dynamicFormModel.normalizedName })
      .returning({ id: dynamicFormModel.id })

    if (!inserted) {
      const conflictingForm = await this.findByNormalizedName(form.normalizedName)
      if (!conflictingForm) return this.add(form)
      throw new DynamicFormNameConflictError(conflictingForm.id)
    }

    if (form.legalTopicIds.length > 0) {
      await this.database.insert(dynamicFormLegalTopicModel).values(
        form.legalTopicIds.map((legalTopicId, position) => ({
          dynamicFormId: form.id,
          legalTopicId,
          position,
        })),
      )
    }
  }

  async addMany(forms: readonly DynamicForm[]): Promise<void> {
    if (forms.length === 0) return

    await this.database.insert(dynamicFormModel).values(
      forms.map((form) => ({
        id: form.id,
        name: form.name,
        normalizedName: form.normalizedName,
        description: form.description,
        status: form.status,
        stage: form.stage,
        legalAreaId: form.legalAreaId,
        fields: form.fields,
        version: form.version,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      })),
    )

    const topicRows = forms.flatMap((form) =>
      form.legalTopicIds.map((legalTopicId, position) => ({
        dynamicFormId: form.id,
        legalTopicId,
        position,
      })),
    )
    if (topicRows.length > 0) {
      await this.database.insert(dynamicFormLegalTopicModel).values(topicRows)
    }
  }

  async replace(
    dynamicFormId: string,
    changes: DynamicFormReplacement,
    expectedVersion: number,
  ) {
    const current = await this.findForReplacement(dynamicFormId)

    if (!current) return { kind: 'not_found' as const }
    if (current.version !== expectedVersion) {
      return { kind: 'version_conflict' as const, currentVersion: current.version }
    }

    if (await this.isReplacementUnchanged(dynamicFormId, current, changes)) {
      return this.readReplacementResult(dynamicFormId, 'unchanged')
    }

    const updated = await this.updateDefinition(dynamicFormId, changes, expectedVersion)
    if (!updated) return this.readReplacementConflict(dynamicFormId)

    await this.replaceTopics(dynamicFormId, changes.legalTopicIds)
    return this.readReplacementResult(dynamicFormId, 'updated')
  }

  async changeStatus(input: {
    id: string
    status: DynamicForm['status']
    updatedAt: Date
  }): Promise<DynamicForm | null> {
    const [current] = await this.database
      .select({ status: dynamicFormModel.status })
      .from(dynamicFormModel)
      .where(eq(dynamicFormModel.id, input.id))
      .for('update')

    if (!current || current.status === input.status) return null

    const [updated] = await this.database
      .update(dynamicFormModel)
      .set({ status: input.status, updatedAt: input.updatedAt })
      .where(eq(dynamicFormModel.id, input.id))
      .returning({ id: dynamicFormModel.id })

    if (!updated) return null
    const form = await this.findById(updated.id)
    return form
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.database
      .delete(dynamicFormModel)
      .where(eq(dynamicFormModel.id, id))
      .returning({ id: dynamicFormModel.id })

    return removed.length > 0
  }

  async removeAll(): Promise<void> {
    await this.database.delete(dynamicFormAdministrationAuditModel)
    await this.database.delete(dynamicFormOperationModel)
    await this.database.delete(dynamicFormModel)
  }

  private async findForReplacement(dynamicFormId: string) {
    const [current] = await this.database
      .select()
      .from(dynamicFormModel)
      .where(eq(dynamicFormModel.id, dynamicFormId))
      .for('update')

    return current
  }

  private async isReplacementUnchanged(
    dynamicFormId: string,
    current: typeof dynamicFormModel.$inferSelect,
    changes: DynamicFormReplacement,
  ) {
    return (
      current.name === changes.name &&
      current.normalizedName === changes.normalizedName &&
      current.description === changes.description &&
      current.stage === changes.stage &&
      current.legalAreaId === changes.legalAreaId &&
      JSON.stringify(current.fields) === JSON.stringify(changes.fields) &&
      (await this.hasSameTopics(dynamicFormId, changes.legalTopicIds))
    )
  }

  private async updateDefinition(
    dynamicFormId: string,
    changes: DynamicFormReplacement,
    expectedVersion: number,
  ) {
    const [updated] = await this.database
      .update(dynamicFormModel)
      .set({
        name: changes.name,
        normalizedName: changes.normalizedName,
        description: changes.description,
        stage: changes.stage,
        legalAreaId: changes.legalAreaId,
        fields: changes.fields,
        updatedAt: changes.updatedAt,
        version: sql`${dynamicFormModel.version} + 1`,
      })
      .where(
        and(
          eq(dynamicFormModel.id, dynamicFormId),
          eq(dynamicFormModel.version, expectedVersion),
        ),
      )
      .returning({ id: dynamicFormModel.id })

    return updated
  }

  private async readReplacementConflict(dynamicFormId: string) {
    const [latest] = await this.database
      .select({ version: dynamicFormModel.version })
      .from(dynamicFormModel)
      .where(eq(dynamicFormModel.id, dynamicFormId))

    return latest
      ? { kind: 'version_conflict' as const, currentVersion: latest.version }
      : { kind: 'not_found' as const }
  }

  private async replaceTopics(dynamicFormId: string, legalTopicIds: string[]) {
    await this.database
      .delete(dynamicFormLegalTopicModel)
      .where(eq(dynamicFormLegalTopicModel.dynamicFormId, dynamicFormId))

    if (legalTopicIds.length === 0) return

    await this.database.insert(dynamicFormLegalTopicModel).values(
      legalTopicIds.map((legalTopicId, position) => ({
        dynamicFormId,
        legalTopicId,
        position,
      })),
    )
  }

  private async readReplacementResult(
    dynamicFormId: string,
    kind: 'unchanged' | 'updated',
  ) {
    const form = await this.findById(dynamicFormId)
    return form ? { kind, form } : { kind: 'not_found' as const }
  }

  private async hasSameTopics(dynamicFormId: string, legalTopicIds: string[]) {
    const rows = await this.database
      .select({ legalTopicId: dynamicFormLegalTopicModel.legalTopicId })
      .from(dynamicFormLegalTopicModel)
      .where(eq(dynamicFormLegalTopicModel.dynamicFormId, dynamicFormId))
      .orderBy(asc(dynamicFormLegalTopicModel.position))

    return (
      rows.length === legalTopicIds.length &&
      rows.every((row, index) => row.legalTopicId === legalTopicIds[index])
    )
  }

  private buildFilters(query: DynamicFormListQuery): SQL | undefined {
    const filters: SQL[] = []
    if (query.search) {
      filters.push(ilike(dynamicFormModel.normalizedName, `%${query.search}%`))
    }
    if (query.stage) filters.push(eq(dynamicFormModel.stage, query.stage))
    if (query.status) filters.push(eq(dynamicFormModel.status, query.status))
    return filters.length > 0 ? and(...filters) : undefined
  }

  private groupRows(
    rows: Array<{
      form: typeof dynamicFormModel.$inferSelect
      area: typeof legalAreaModel.$inferSelect
      formTopic: typeof dynamicFormLegalTopicModel.$inferSelect | null
      topic: typeof legalTopicModel.$inferSelect | null
    }>,
  ) {
    const groups = new Map<
      string,
      {
        form: typeof dynamicFormModel.$inferSelect
        area: typeof legalAreaModel.$inferSelect
        topics: Array<
          typeof dynamicFormLegalTopicModel.$inferSelect & {
            topic: typeof legalTopicModel.$inferSelect | null
          }
        >
      }
    >()

    for (const row of rows) {
      const group = groups.get(row.form.id) ?? {
        form: row.form,
        area: row.area,
        topics: [],
      }
      if (row.formTopic) group.topics.push({ ...row.formTopic, topic: row.topic })
      groups.set(row.form.id, group)
    }

    return [...groups.values()]
  }
}
