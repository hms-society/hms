import { Injectable } from '@nestjs/common'
import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type {
  DynamicFormListQuery,
  DynamicFormListResult,
} from '@hms/core/legal-catalog/domain/structures'
import { DynamicFormNameConflictError } from '@hms/core/legal-catalog/domain/errors'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'
import { and, asc, countDistinct, eq, ilike, inArray, type SQL } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import {
  dynamicFormAdministrationAuditModel,
  dynamicFormDuplicateOperationModel,
  dynamicFormLegalTopicModel,
  dynamicFormModel,
  legalAreaModel,
  legalTopicModel,
} from '@/legal-catalog/database/drizzle/models'
import { DynamicFormMapper } from '@/legal-catalog/database/drizzle/mappers'

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
    await this.database.delete(dynamicFormDuplicateOperationModel)
    await this.database.delete(dynamicFormModel)
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
