import { Inject, Injectable } from '@nestjs/common'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import type {
  DocumentSpecificationConfigurationUpdate,
  DocumentSpecificationListQuery,
  DocumentSpecificationTemplateUpdate,
} from '@hms/core/document-production/domain/structures'
import { PaginationResponse } from '@hms/core/shared/responses/pagination-response'
import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { PgTransaction } from 'drizzle-orm/pg-core'

import {
  documentGenerationModel,
  documentModel,
  documentPackageModel,
  documentSpecificationLegalAreaModel,
  documentSpecificationLegalTopicModel,
  documentSpecificationModel,
  documentSpecificationAuditLogModel,
  packageDocumentModel,
  documentVersionModel,
} from '@/document-production/database/drizzle/models'
import { DrizzleDocumentSpecificationMapper } from '@/document-production/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { Database } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

type DocumentProductionDatabaseExecutor = Database | PgTransaction<any, any, any>

@Injectable()
export class DrizzleDocumentSpecificationsRepository
  extends DrizzleRepository
  implements DocumentSpecificationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleDocumentSpecificationMapper)
    private readonly mapper: DrizzleDocumentSpecificationMapper,
  ) {
    super(drizzle)
  }

  async list(query: DocumentSpecificationListQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = this.buildWhere(query)
    const [{ total }] = await this.database
      .select({ total: count(documentSpecificationModel.id) })
      .from(documentSpecificationModel)
      .where(where)

    const specifications = await this.database
      .select()
      .from(documentSpecificationModel)
      .where(where)
      .orderBy(
        asc(sql`lower(trim(${documentSpecificationModel.name}))`),
        asc(documentSpecificationModel.id),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const specificationIds = specifications.map(({ id }) => id)
    const legalAreas = specificationIds.length
      ? await this.database
          .select()
          .from(documentSpecificationLegalAreaModel)
          .where(
            inArray(
              documentSpecificationLegalAreaModel.documentSpecificationId,
              specificationIds,
            ),
          )
      : []
    const legalTopics = specificationIds.length
      ? await this.database
          .select()
          .from(documentSpecificationLegalTopicModel)
          .where(
            inArray(
              documentSpecificationLegalTopicModel.documentSpecificationId,
              specificationIds,
            ),
          )
      : []
    const topicsByArea = new Map<string, string[]>()
    for (const topic of legalTopics) {
      const key = `${topic.documentSpecificationId}:${topic.legalAreaId}`
      const topics = topicsByArea.get(key) ?? []
      topics.push(topic.legalTopicId)
      topicsByArea.set(key, topics)
    }
    const areasBySpecification = new Map<string, string[]>()
    const topicsBySpecification = new Map<string, Record<string, string[]>>()
    for (const area of legalAreas) {
      const areas = areasBySpecification.get(area.documentSpecificationId) ?? []
      areas.push(area.legalAreaId)
      areasBySpecification.set(area.documentSpecificationId, areas)
      const topics = topicsBySpecification.get(area.documentSpecificationId) ?? {}
      topics[area.legalAreaId] =
        topicsByArea.get(`${area.documentSpecificationId}:${area.legalAreaId}`) ?? []
      topicsBySpecification.set(area.documentSpecificationId, topics)
    }

    const items = specifications.map((specification) => {
      const domain = this.mapper.toDomain(specification)
      const legalAreaIds = areasBySpecification.get(specification.id) ?? []
      return {
        documentSpecificationId: domain.id,
        name: domain.name,
        description: domain.description,
        application: {
          ...domain.application,
          legalAreaIds,
          legalTopicIdsByArea: topicsBySpecification.get(specification.id) ?? {},
        },
        status: domain.status,
        accessClassification: domain.accessClassification,
      }
    })

    return new PaginationResponse(
      items,
      page,
      pageSize,
      Number(total),
      Math.ceil(Number(total) / pageSize),
    )
  }

  async addMany(specifications: readonly DocumentSpecificationCreation[]) {
    if (specifications.length === 0) return []

    const created = await this.database.transaction(async (transaction) => {
      const records = await transaction
        .insert(documentSpecificationModel)
        .values(
          specifications.map((specification) => ({
            name: specification.name,
            description: specification.description,
            content: specification.content,
            variables: [...specification.variables],
            moment: specification.application.moment,
            scope: specification.application.scope,
            status: specification.status,
            accessClassification: specification.accessClassification,
          })),
        )
        .returning()

      for (const [index, specification] of specifications.entries()) {
        const record = records[index]
        if (!record || specification.application.scope !== 'legal_context') continue
        const application = specification.application
        await transaction.insert(documentSpecificationLegalAreaModel).values(
          application.legalAreaIds.map((legalAreaId) => ({
            documentSpecificationId: record.id,
            legalAreaId,
          })),
        )
        const topics = application.legalAreaIds.flatMap((legalAreaId) =>
          (application.legalTopicIdsByArea[legalAreaId] ?? []).map((legalTopicId) => ({
            documentSpecificationId: record.id,
            legalAreaId,
            legalTopicId,
          })),
        )
        if (topics.length)
          await transaction.insert(documentSpecificationLegalTopicModel).values(topics)
      }
      return records
    })

    return created.map((record) => this.mapper.toDomain(record))
  }

  async add(specification: DocumentSpecificationCreation) {
    return this.database.transaction(async (transaction) => {
      const [record] = await transaction
        .insert(documentSpecificationModel)
        .values({
          name: specification.name,
          description: specification.description,
          content: specification.content,
          variables: [...specification.variables],
          moment: specification.application.moment,
          scope: specification.application.scope,
          status: specification.status,
          accessClassification: specification.accessClassification,
        })
        .returning()

      if (!record) throw new Error('Document specification was not created')

      await this.replaceAssociations(transaction, record.id, specification.application)

      return this.toDomain(transaction, record)
    })
  }

  async findById(documentSpecificationId: string) {
    const [record] = await this.database
      .select()
      .from(documentSpecificationModel)
      .where(eq(documentSpecificationModel.id, documentSpecificationId))
      .limit(1)

    return record ? this.toDomain(this.database, record) : undefined
  }

  async replaceConfiguration(
    documentSpecificationId: string,
    changes: DocumentSpecificationConfigurationUpdate,
  ) {
    return this.database.transaction(async (transaction) => {
      const [record] = await transaction
        .update(documentSpecificationModel)
        .set({
          name: changes.name,
          description: changes.description,
          moment: changes.application.moment,
          scope: changes.application.scope,
          status: changes.status,
          accessClassification: changes.accessClassification,
          ...(changes.content !== undefined ? { content: changes.content } : {}),
          ...(changes.variables !== undefined
            ? { variables: [...changes.variables] }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(documentSpecificationModel.id, documentSpecificationId))
        .returning()

      if (!record) return undefined

      await this.replaceAssociations(transaction, record.id, changes.application)

      return this.toDomain(transaction, record)
    })
  }

  async replaceTemplate(
    documentSpecificationId: string,
    changes: DocumentSpecificationTemplateUpdate,
  ) {
    return this.database.transaction(async (transaction) => {
      const [record] = await transaction
        .update(documentSpecificationModel)
        .set({
          content: changes.content,
          variables: [...changes.variables],
          updatedAt: new Date(),
        })
        .where(eq(documentSpecificationModel.id, documentSpecificationId))
        .returning()

      return record ? this.toDomain(transaction, record) : undefined
    })
  }

  async remove(documentSpecificationId: string) {
    const deleted = await this.database
      .delete(documentSpecificationModel)
      .where(eq(documentSpecificationModel.id, documentSpecificationId))
      .returning({ id: documentSpecificationModel.id })

    return deleted.length > 0
  }

  async removeAll() {
    await this.database.delete(packageDocumentModel)
    await this.database.delete(documentPackageModel)
    await this.database.delete(documentVersionModel)
    await this.database.delete(documentModel)
    await this.database.delete(documentGenerationModel)
    await this.database.delete(documentSpecificationLegalTopicModel)
    await this.database.delete(documentSpecificationLegalAreaModel)
    await this.database.delete(documentSpecificationModel)
  }

  async registerAuditLog(data: {
    documentSpecificationId: string
    userId: string
    action: string
    previousValue: string
    newValue: string
  }): Promise<void> {
    await this.database.insert(documentSpecificationAuditLogModel).values({
      documentSpecificationId: data.documentSpecificationId,
      userId: data.userId,
      action: data.action,
      previousValue: data.previousValue,
      newValue: data.newValue,
    })
  }

  private async toDomain(
    database: DocumentProductionDatabaseExecutor,
    record: typeof documentSpecificationModel.$inferSelect,
  ) {
    if (record.scope === 'global') return this.mapper.toDomain(record)

    const [legalAreas, legalTopics] = await Promise.all([
      database
        .select()
        .from(documentSpecificationLegalAreaModel)
        .where(
          eq(documentSpecificationLegalAreaModel.documentSpecificationId, record.id),
        ),
      database
        .select()
        .from(documentSpecificationLegalTopicModel)
        .where(
          eq(documentSpecificationLegalTopicModel.documentSpecificationId, record.id),
        ),
    ])
    const legalTopicIdsByArea: Record<string, string[]> = {}
    for (const topic of legalTopics) {
      const topics = legalTopicIdsByArea[topic.legalAreaId] ?? []
      topics.push(topic.legalTopicId)
      legalTopicIdsByArea[topic.legalAreaId] = topics
    }

    const domain = this.mapper.toDomain(record)
    return {
      ...domain,
      application: {
        ...domain.application,
        legalAreaIds: legalAreas.map(({ legalAreaId }) => legalAreaId),
        legalTopicIdsByArea,
      },
    }
  }

  private async replaceAssociations(
    database: DocumentProductionDatabaseExecutor,
    documentSpecificationId: string,
    application: DocumentSpecificationConfigurationUpdate['application'],
  ) {
    await database
      .delete(documentSpecificationLegalTopicModel)
      .where(
        eq(
          documentSpecificationLegalTopicModel.documentSpecificationId,
          documentSpecificationId,
        ),
      )
    await database
      .delete(documentSpecificationLegalAreaModel)
      .where(
        eq(
          documentSpecificationLegalAreaModel.documentSpecificationId,
          documentSpecificationId,
        ),
      )

    if (application.scope !== 'legal_context') return

    if (application.legalAreaIds.length) {
      await database.insert(documentSpecificationLegalAreaModel).values(
        application.legalAreaIds.map((legalAreaId) => ({
          documentSpecificationId,
          legalAreaId,
        })),
      )
    }

    const topics = application.legalAreaIds.flatMap((legalAreaId) =>
      (application.legalTopicIdsByArea[legalAreaId] ?? []).map((legalTopicId) => ({
        documentSpecificationId,
        legalAreaId,
        legalTopicId,
      })),
    )
    if (topics.length)
      await database.insert(documentSpecificationLegalTopicModel).values(topics)
  }

  private buildWhere(query: DocumentSpecificationListQuery): SQL | undefined {
    const conditions: SQL[] = []
    if (query.search) {
      const searchPattern = `%${this.escapeLikePattern(query.search)}%`
      const searchCondition = or(
        ilike(documentSpecificationModel.name, searchPattern),
        ilike(documentSpecificationModel.description, searchPattern),
      )
      if (searchCondition) conditions.push(searchCondition)
    }
    if (query.moment) conditions.push(eq(documentSpecificationModel.moment, query.moment))
    if (query.status) conditions.push(eq(documentSpecificationModel.status, query.status))
    if (query.legalAreaId && query.legalTopicId) {
      conditions.push(
        exists(
          this.database
            .select({ id: sql`1` })
            .from(documentSpecificationLegalTopicModel)
            .innerJoin(
              documentSpecificationLegalAreaModel,
              and(
                eq(
                  documentSpecificationLegalTopicModel.documentSpecificationId,
                  documentSpecificationLegalAreaModel.documentSpecificationId,
                ),
                eq(
                  documentSpecificationLegalTopicModel.legalAreaId,
                  documentSpecificationLegalAreaModel.legalAreaId,
                ),
              ),
            )
            .where(
              and(
                eq(
                  documentSpecificationLegalAreaModel.documentSpecificationId,
                  documentSpecificationModel.id,
                ),
                eq(documentSpecificationLegalAreaModel.legalAreaId, query.legalAreaId),
                eq(documentSpecificationLegalTopicModel.legalTopicId, query.legalTopicId),
              ),
            ),
        ),
      )
    } else if (query.legalAreaId) {
      conditions.push(
        exists(
          this.database
            .select({ id: sql`1` })
            .from(documentSpecificationLegalAreaModel)
            .where(
              and(
                eq(
                  documentSpecificationLegalAreaModel.documentSpecificationId,
                  documentSpecificationModel.id,
                ),
                eq(documentSpecificationLegalAreaModel.legalAreaId, query.legalAreaId),
              ),
            ),
        ),
      )
    } else if (query.legalTopicId) {
      conditions.push(
        exists(
          this.database
            .select({ id: sql`1` })
            .from(documentSpecificationLegalTopicModel)
            .innerJoin(
              documentSpecificationLegalAreaModel,
              and(
                eq(
                  documentSpecificationLegalTopicModel.documentSpecificationId,
                  documentSpecificationLegalAreaModel.documentSpecificationId,
                ),
                eq(
                  documentSpecificationLegalTopicModel.legalAreaId,
                  documentSpecificationLegalAreaModel.legalAreaId,
                ),
              ),
            )
            .where(
              and(
                eq(
                  documentSpecificationLegalAreaModel.documentSpecificationId,
                  documentSpecificationModel.id,
                ),
                eq(documentSpecificationLegalTopicModel.legalTopicId, query.legalTopicId),
              ),
            ),
        ),
      )
    }
    return conditions.length ? and(...conditions) : undefined
  }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&')
  }
}
