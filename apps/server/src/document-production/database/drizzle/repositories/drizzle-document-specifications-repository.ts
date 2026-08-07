import { Inject, Injectable } from '@nestjs/common'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import type { DocumentSpecificationListQuery } from '@hms/core/document-production/domain/structures'
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

import {
  documentSpecificationLegalAreaModel,
  documentSpecificationLegalTopicModel,
  documentSpecificationModel,
} from '@/document-production/database/drizzle/models'
import { DrizzleDocumentSpecificationMapper } from '@/document-production/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

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
      const application =
        domain.application.scope === 'legal_context'
          ? {
              ...domain.application,
              legalAreaIds,
              legalTopicIdsByArea: topicsBySpecification.get(specification.id) ?? {},
            }
          : domain.application
      return {
        documentSpecificationId: domain.id,
        name: domain.name,
        description: domain.description,
        application,
        isRequired: domain.isRequired,
        status: domain.status,
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
            isRequired: specification.isRequired,
            status: specification.status,
          })),
        )
        .returning()

      for (const [index, specification] of specifications.entries()) {
        const record = records[index]
        const application = specification.application
        if (!record || application.scope !== 'legal_context') continue
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

  async removeAll() {
    await this.database.delete(documentSpecificationModel)
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
