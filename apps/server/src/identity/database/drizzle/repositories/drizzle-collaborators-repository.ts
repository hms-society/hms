import { Inject, Injectable, Optional } from '@nestjs/common'
import type {
  Collaborator,
  CollaboratorCreation,
  CollaboratorSummary,
  CollaboratorUpdate,
} from '@hms/core/identity/domain/entities'
import { PaginationResponse } from '@hms/core/shared/responses/pagination-response'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'
import type {
  LegalExpertiseCatalogProvider,
  LegalExpertiseCatalogResolution,
  LegalExpertiseSelection,
} from '@hms/core/legal-catalog/interfaces'
import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNotNull,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'

import { DrizzleCollaboratorMapper } from '@/identity/database/drizzle/mappers'
import {
  collaboratorLegalExpertiseModel,
  collaboratorLegalExpertiseTopicModel,
  collaboratorModel,
  userModel,
} from '@/identity/database/drizzle/models'
import {
  DrizzleIdentityRepository,
  type IdentityDatabaseExecutor,
} from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import type { DrizzleCollaboratorRecord } from '@/identity/database/drizzle/types'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'

@Injectable()
export class DrizzleCollaboratorsRepository
  extends DrizzleIdentityRepository
  implements CollaboratorsRepository
{
  constructor(
    @Inject(DrizzleClient)
    drizzle: DrizzleClient,
    @Inject(DrizzleCollaboratorMapper)
    private readonly collaboratorMapper: DrizzleCollaboratorMapper,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
    @Optional()
    databaseOverride?: IdentityDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  async findById(collaboratorId: string): Promise<Collaborator | undefined> {
    const [collaborator] = await this.database
      .select()
      .from(collaboratorModel)
      .where(eq(collaboratorModel.id, collaboratorId))
      .limit(1)

    return collaborator
      ? this.collaboratorMapper.toDomain(await this.loadRecord(collaborator))
      : undefined
  }

  async findSummaryById(
    collaboratorId: string,
  ): Promise<CollaboratorSummary | undefined> {
    const [record] = await this.database
      .select({ collaborator: collaboratorModel, user: userModel })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(eq(collaboratorModel.id, collaboratorId))
      .limit(1)

    return record
      ? this.collaboratorMapper.toSummary({
          ...record,
          legalExpertises:
            (await this.loadExpertises([record.collaborator.id])).get(
              record.collaborator.id,
            ) ?? [],
        })
      : undefined
  }

  async findByUserId(userId: string): Promise<Collaborator | undefined> {
    const [collaborator] = await this.database
      .select()
      .from(collaboratorModel)
      .where(eq(collaboratorModel.userId, userId))
      .limit(1)

    return collaborator
      ? this.collaboratorMapper.toDomain(await this.loadRecord(collaborator))
      : undefined
  }

  async findSummaryByUserId(userId: string): Promise<CollaboratorSummary | undefined> {
    const [record] = await this.database
      .select({ collaborator: collaboratorModel, user: userModel })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(eq(collaboratorModel.userId, userId))
      .limit(1)

    return record
      ? this.collaboratorMapper.toSummary({
          ...record,
          legalExpertises:
            (await this.loadExpertises([record.collaborator.id])).get(
              record.collaborator.id,
            ) ?? [],
        })
      : undefined
  }

  async add(collaborator: CollaboratorCreation): Promise<Collaborator | undefined> {
    return this.database.transaction(async (transaction) => {
      return this.withDatabase(transaction).addWithinDatabase(collaborator)
    })
  }

  async replace(
    collaboratorId: string,
    changes: CollaboratorUpdate,
  ): Promise<Collaborator | undefined> {
    return this.database.transaction(async (transaction) => {
      return this.withDatabase(transaction).replaceWithinDatabase(collaboratorId, changes)
    })
  }

  async removeAll(): Promise<void> {
    await this.database.delete(collaboratorLegalExpertiseTopicModel)
    await this.database.delete(collaboratorLegalExpertiseModel)
    await this.database.delete(collaboratorModel)
  }

  async removeById(collaboratorId: string): Promise<void> {
    await this.database
      .delete(collaboratorModel)
      .where(eq(collaboratorModel.id, collaboratorId))
  }

  async list(
    query: CollaboratorListQuery,
  ): Promise<PaginationResponse<CollaboratorSummary>> {
    const page = query.page ?? 1
    const pageSize = query.limit ?? query.pageSize ?? 20
    const where = this.buildWhere(query)

    const [{ total }] = await this.database
      .select({ total: count() })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(where)

    const records = await this.database
      .select({ collaborator: collaboratorModel, user: userModel })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(where)
      .orderBy(asc(collaboratorModel.professionalName), asc(collaboratorModel.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const legalExpertises = await this.loadExpertises(
      records.map(({ collaborator: item }) => item.id),
    )
    const items = records.map(({ collaborator: item, user }) =>
      this.collaboratorMapper.toSummary({
        collaborator: item,
        user,
        legalExpertises: legalExpertises.get(item.id) ?? [],
      }),
    )

    return new PaginationResponse(
      items,
      page,
      pageSize,
      total,
      Math.ceil(total / pageSize),
    )
  }

  async listAvailableJobTitles(): Promise<readonly string[]> {
    const records = await this.database
      .selectDistinct({ jobTitle: collaboratorModel.jobTitle })
      .from(collaboratorModel)
      .where(
        and(
          isNotNull(collaboratorModel.jobTitle),
          sql`btrim(${collaboratorModel.jobTitle}) <> ''`,
        ),
      )
      .orderBy(asc(collaboratorModel.jobTitle))

    return records.flatMap(({ jobTitle }) => (jobTitle ? [jobTitle] : []))
  }

  withDatabase(database: IdentityDatabaseExecutor) {
    return new DrizzleCollaboratorsRepository(
      this.drizzleClient,
      this.collaboratorMapper,
      this.legalExpertiseCatalogProvider,
      database,
    )
  }

  private async addWithinDatabase(collaborator: CollaboratorCreation) {
    const [createdCollaborator] = await this.database
      .insert(collaboratorModel)
      .values({
        userId: collaborator.userId,
        professionalName: collaborator.professionalName,
        jobTitle: collaborator.jobTitle ?? null,
        profile: collaborator.profile,
      })
      .returning()

    if (!createdCollaborator) return undefined

    if ('legalExpertises' in collaborator && collaborator.legalExpertises) {
      const legalExpertises = collaborator.legalExpertises
      const createdExpertises = await this.database
        .insert(collaboratorLegalExpertiseModel)
        .values(
          legalExpertises.map(({ legalAreaId }) => ({
            collaboratorId: createdCollaborator.id,
            legalAreaId,
          })),
        )
        .returning()

      const topicRows = createdExpertises.flatMap((expertise, index) =>
        legalExpertises[index].legalTopicIds.map((legalTopicId) => ({
          expertiseId: expertise.id,
          legalTopicId,
        })),
      )

      if (topicRows.length > 0) {
        await this.database.insert(collaboratorLegalExpertiseTopicModel).values(topicRows)
      }
    }

    return this.collaboratorMapper.toDomain(await this.loadRecord(createdCollaborator))
  }

  private async replaceWithinDatabase(
    collaboratorId: string,
    changes: CollaboratorUpdate,
  ) {
    const [updatedCollaborator] = await this.database
      .update(collaboratorModel)
      .set({
        professionalName: changes.professionalName,
        jobTitle: changes.jobTitle ?? null,
        profile: changes.profile,
        updatedAt: new Date(),
      })
      .where(eq(collaboratorModel.id, collaboratorId))
      .returning()

    if (!updatedCollaborator) return undefined

    const existingExpertises = await this.database
      .select({ id: collaboratorLegalExpertiseModel.id })
      .from(collaboratorLegalExpertiseModel)
      .where(eq(collaboratorLegalExpertiseModel.collaboratorId, collaboratorId))

    if (existingExpertises.length > 0) {
      await this.database.delete(collaboratorLegalExpertiseTopicModel).where(
        inArray(
          collaboratorLegalExpertiseTopicModel.expertiseId,
          existingExpertises.map(({ id }) => id),
        ),
      )
      await this.database
        .delete(collaboratorLegalExpertiseModel)
        .where(eq(collaboratorLegalExpertiseModel.collaboratorId, collaboratorId))
    }

    if ('legalExpertises' in changes && changes.legalExpertises) {
      const createdExpertises = await this.database
        .insert(collaboratorLegalExpertiseModel)
        .values(
          changes.legalExpertises.map(({ legalAreaId }) => ({
            collaboratorId,
            legalAreaId,
          })),
        )
        .returning()

      const topicRows = createdExpertises.flatMap((expertise, index) =>
        changes.legalExpertises[index].legalTopicIds.map((legalTopicId) => ({
          expertiseId: expertise.id,
          legalTopicId,
        })),
      )

      if (topicRows.length > 0) {
        await this.database.insert(collaboratorLegalExpertiseTopicModel).values(topicRows)
      }
    }

    return this.collaboratorMapper.toDomain(await this.loadRecord(updatedCollaborator))
  }

  private buildWhere(query: CollaboratorListQuery) {
    const filters: SQL[] = []

    if (query.excludeUserId) {
      filters.push(ne(userModel.id, query.excludeUserId))
    }

    if (query.search) {
      const searchFilter = or(
        ilike(collaboratorModel.professionalName, `%${query.search}%`),
        ilike(userModel.email, `%${query.search}%`),
      )
      if (searchFilter) filters.push(searchFilter)
    }
    if (query.profile) filters.push(eq(collaboratorModel.profile, query.profile))
    if (query.jobTitle) {
      filters.push(
        sql`lower(btrim(${collaboratorModel.jobTitle})) = lower(btrim(${query.jobTitle}))`,
      )
    }
    if (query.status) filters.push(eq(userModel.status, query.status))

    return filters.length > 0 ? and(...filters) : undefined
  }

  private async loadRecord(collaborator: typeof collaboratorModel.$inferSelect) {
    const legalExpertises = await this.database
      .select()
      .from(collaboratorLegalExpertiseModel)
      .where(eq(collaboratorLegalExpertiseModel.collaboratorId, collaborator.id))
      .orderBy(asc(collaboratorLegalExpertiseModel.id))

    const topics = legalExpertises.length
      ? await this.database
          .select()
          .from(collaboratorLegalExpertiseTopicModel)
          .where(
            inArray(
              collaboratorLegalExpertiseTopicModel.expertiseId,
              legalExpertises.map(({ id }) => id),
            ),
          )
          .orderBy(asc(collaboratorLegalExpertiseTopicModel.id))
      : []

    return {
      collaborator,
      legalExpertises: legalExpertises.map((expertise) => ({
        expertise,
        topics: topics.filter((topic) => topic.expertiseId === expertise.id),
      })),
    } satisfies DrizzleCollaboratorRecord
  }

  private async loadExpertises(collaboratorIds: string[]) {
    if (collaboratorIds.length === 0) return new Map()

    const expertises = await this.database
      .select()
      .from(collaboratorLegalExpertiseModel)
      .where(inArray(collaboratorLegalExpertiseModel.collaboratorId, collaboratorIds))
      .orderBy(asc(collaboratorLegalExpertiseModel.id))

    if (expertises.length === 0) return new Map()

    const topics = await this.database
      .select()
      .from(collaboratorLegalExpertiseTopicModel)
      .where(
        inArray(
          collaboratorLegalExpertiseTopicModel.expertiseId,
          expertises.map(({ id }) => id),
        ),
      )
      .orderBy(asc(collaboratorLegalExpertiseTopicModel.id))

    const selections: {
      collaboratorId: string
      selection: LegalExpertiseSelection
    }[] = expertises.map((expertise) => ({
      collaboratorId: expertise.collaboratorId,
      selection: {
        legalAreaId: expertise.legalAreaId,
        legalTopicIds: topics
          .filter(({ expertiseId }) => expertiseId === expertise.id)
          .map(({ legalTopicId }) => legalTopicId),
      },
    }))
    const resolutions = await this.legalExpertiseCatalogProvider.resolve(
      selections.map(({ selection }) => selection),
    )
    const resolvedByCollaborator = new Map<string, LegalExpertiseCatalogResolution[]>()

    selections.forEach(({ collaboratorId }, index) => {
      const current = resolvedByCollaborator.get(collaboratorId) ?? []
      current.push(resolutions[index])
      resolvedByCollaborator.set(collaboratorId, current)
    })

    return resolvedByCollaborator
  }
}
