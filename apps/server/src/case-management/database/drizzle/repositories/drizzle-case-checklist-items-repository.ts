import { Injectable } from '@nestjs/common'
import { CaseChecklistItemStatus } from '@hms/core/case-management/domain/structures'
import type { CaseChecklistItemsRepository } from '@hms/core/case-management/interfaces'
import { and, asc, count, eq, getTableColumns, gte, inArray, lt, sql } from 'drizzle-orm'

import { DrizzleCaseChecklistItemMapper } from '@/case-management/database/drizzle/mappers'
import {
  caseChecklistItemModel,
  checklistTemplateItemModel,
  checklistTemplateModel,
} from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleCaseChecklistItemsRepository
  extends DrizzleRepository
  implements CaseChecklistItemsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleCaseChecklistItemMapper,
  ) {
    super(drizzle)
  }

  async findById(
    caseId: string,
    checklistItemId: string,
  ): ReturnType<CaseChecklistItemsRepository['findById']> {
    const [item] = await this.database
      .select({
        ...getTableColumns(caseChecklistItemModel),
        checklistTemplateName: checklistTemplateModel.name,
      })
      .from(caseChecklistItemModel)
      .leftJoin(
        checklistTemplateItemModel,
        sql`${caseChecklistItemModel.templateItemKey} = ${checklistTemplateItemModel.id}::text`,
      )
      .leftJoin(
        checklistTemplateModel,
        eq(checklistTemplateModel.id, checklistTemplateItemModel.checklistTemplateId),
      )
      .where(
        and(
          eq(caseChecklistItemModel.id, checklistItemId),
          eq(caseChecklistItemModel.caseId, caseId),
        ),
      )
      .limit(1)

    return item ? this.mapper.toDomain(item) : undefined
  }

  async replace(
    checklistItemId: string,
    changes: Parameters<CaseChecklistItemsRepository['replace']>[1],
    expected: Parameters<CaseChecklistItemsRepository['replace']>[2],
  ): ReturnType<CaseChecklistItemsRepository['replace']> {
    const revision = new Date(expected.updatedAt)
    const nextRevision = new Date(revision.getTime() + 1)
    const conditions = [
      eq(caseChecklistItemModel.id, checklistItemId),
      eq(caseChecklistItemModel.caseId, expected.caseId),
      gte(caseChecklistItemModel.updatedAt, revision),
      lt(caseChecklistItemModel.updatedAt, nextRevision),
    ]

    if (expected.clientDocumentId) {
      conditions.push(
        eq(caseChecklistItemModel.clientDocumentId, expected.clientDocumentId),
      )
    }

    const [item] = await this.database
      .update(caseChecklistItemModel)
      .set({
        status: changes.status,
        waiverJustification: changes.waiver?.justification ?? null,
        waiverActorId: changes.waiver?.actorId ?? null,
        waiverActorName: changes.waiver?.actorName ?? null,
        waivedAt: changes.waiver?.grantedAt ?? null,
        clientDocumentId: changes.documentReference?.clientDocumentId ?? null,
        documentSource: changes.documentReference?.source ?? null,
        documentAttachedAt: changes.documentReference?.attachedAt ?? null,
        documentAttachedBy: changes.documentReference?.attachedBy ?? null,
        documentFileName: changes.documentFileName ?? null,
        documentFileId: changes.documentFileId ?? null,
        validatedAt: changes.validatedAt ?? null,
        validatedBy: changes.validatedBy ?? null,
        updatedAt: changes.updatedAt,
      })
      .where(and(...conditions))
      .returning()

    return item ? this.mapper.toDomain(item) : undefined
  }

  async addMany(
    checklistItems: Parameters<CaseChecklistItemsRepository['addMany']>[0],
  ): ReturnType<CaseChecklistItemsRepository['addMany']> {
    if (checklistItems.length === 0) return []

    const createdItems = await this.database
      .insert(caseChecklistItemModel)
      .values([...checklistItems])
      .onConflictDoNothing()
      .returning()

    return createdItems.map((item) => this.mapper.toDomain(item))
  }

  async listByCaseId(
    caseId: string,
  ): ReturnType<CaseChecklistItemsRepository['listByCaseId']> {
    const items = await this.database
      .select({
        id: caseChecklistItemModel.id,
        caseId: caseChecklistItemModel.caseId,
        templateItemKey: caseChecklistItemModel.templateItemKey,
        title: caseChecklistItemModel.title,
        isRequired: caseChecklistItemModel.isRequired,
        status: caseChecklistItemModel.status,
        documentFileId: caseChecklistItemModel.documentFileId,
        documentFileName: caseChecklistItemModel.documentFileName,
        waiverJustification: caseChecklistItemModel.waiverJustification,
        waiverActorId: caseChecklistItemModel.waiverActorId,
        waiverActorName: caseChecklistItemModel.waiverActorName,
        waivedAt: caseChecklistItemModel.waivedAt,
        clientDocumentId: caseChecklistItemModel.clientDocumentId,
        documentSource: caseChecklistItemModel.documentSource,
        documentAttachedAt: caseChecklistItemModel.documentAttachedAt,
        documentAttachedBy: caseChecklistItemModel.documentAttachedBy,
        validatedAt: caseChecklistItemModel.validatedAt,
        validatedBy: caseChecklistItemModel.validatedBy,
        createdAt: caseChecklistItemModel.createdAt,
        updatedAt: caseChecklistItemModel.updatedAt,
        checklistTemplateName: checklistTemplateModel.name,
      })
      .from(caseChecklistItemModel)
      .leftJoin(
        checklistTemplateItemModel,
        sql`${caseChecklistItemModel.templateItemKey} = ${checklistTemplateItemModel.id}::text`,
      )
      .leftJoin(
        checklistTemplateModel,
        eq(checklistTemplateModel.id, checklistTemplateItemModel.checklistTemplateId),
      )
      .where(eq(caseChecklistItemModel.caseId, caseId))
      .orderBy(asc(caseChecklistItemModel.createdAt))

    return items.map((item) => this.mapper.toDomain(item))
  }

  async listStatusCountsByCaseIds(
    caseIds: readonly string[],
  ): ReturnType<CaseChecklistItemsRepository['listStatusCountsByCaseIds']> {
    if (caseIds.length === 0) return []

    return this.database
      .select({
        caseId: caseChecklistItemModel.caseId,
        isRequired: caseChecklistItemModel.isRequired,
        status: caseChecklistItemModel.status,
        count: count(),
      })
      .from(caseChecklistItemModel)
      .where(inArray(caseChecklistItemModel.caseId, [...caseIds]))
      .groupBy(
        caseChecklistItemModel.caseId,
        caseChecklistItemModel.isRequired,
        caseChecklistItemModel.status,
      )
  }

  async findByDocumentFileId(
    documentFileId: string,
  ): ReturnType<CaseChecklistItemsRepository['findByDocumentFileId']> {
    const [item] = await this.database
      .select({
        id: caseChecklistItemModel.id,
        caseId: caseChecklistItemModel.caseId,
        templateItemKey: caseChecklistItemModel.templateItemKey,
        title: caseChecklistItemModel.title,
        isRequired: caseChecklistItemModel.isRequired,
        status: caseChecklistItemModel.status,
        documentFileId: caseChecklistItemModel.documentFileId,
        documentFileName: caseChecklistItemModel.documentFileName,
        waiverJustification: caseChecklistItemModel.waiverJustification,
        waiverActorId: caseChecklistItemModel.waiverActorId,
        waiverActorName: caseChecklistItemModel.waiverActorName,
        waivedAt: caseChecklistItemModel.waivedAt,
        clientDocumentId: caseChecklistItemModel.clientDocumentId,
        documentSource: caseChecklistItemModel.documentSource,
        documentAttachedAt: caseChecklistItemModel.documentAttachedAt,
        documentAttachedBy: caseChecklistItemModel.documentAttachedBy,
        validatedAt: caseChecklistItemModel.validatedAt,
        validatedBy: caseChecklistItemModel.validatedBy,
        createdAt: caseChecklistItemModel.createdAt,
        updatedAt: caseChecklistItemModel.updatedAt,
        checklistTemplateName: checklistTemplateModel.name,
      })
      .from(caseChecklistItemModel)
      .leftJoin(
        checklistTemplateItemModel,
        sql`${caseChecklistItemModel.templateItemKey} = ${checklistTemplateItemModel.id}::text`,
      )
      .leftJoin(
        checklistTemplateModel,
        eq(checklistTemplateModel.id, checklistTemplateItemModel.checklistTemplateId),
      )
      .where(eq(caseChecklistItemModel.documentFileId, documentFileId))
      .limit(1)

    return item ? this.mapper.toDomain(item) : undefined
  }

  async linkPendingDocument({
    checklistItemId,
    documentFileId,
    documentFileName,
  }: Parameters<CaseChecklistItemsRepository['linkPendingDocument']>[0]): ReturnType<
    CaseChecklistItemsRepository['linkPendingDocument']
  > {
    const [updatedItem] = await this.database
      .update(caseChecklistItemModel)
      .set({
        documentFileId,
        documentFileName,
        status: CaseChecklistItemStatus.Pending,
        updatedAt: new Date(),
        validatedAt: null,
        validatedBy: null,
      })
      .where(eq(caseChecklistItemModel.id, checklistItemId))
      .returning()

    return updatedItem ? this.mapper.toDomain(updatedItem) : undefined
  }

  async markAsInAnalysisByDocument({
    checklistItemId,
    documentFileId,
    documentFileName,
  }: Parameters<
    CaseChecklistItemsRepository['markAsInAnalysisByDocument']
  >[0]): ReturnType<CaseChecklistItemsRepository['markAsInAnalysisByDocument']> {
    const [updatedItem] = await this.database
      .update(caseChecklistItemModel)
      .set({
        documentFileId,
        documentFileName,
        status: CaseChecklistItemStatus.InAnalysis,
        updatedAt: new Date(),
        validatedAt: null,
        validatedBy: null,
      })
      .where(eq(caseChecklistItemModel.id, checklistItemId))
      .returning()

    return updatedItem ? this.mapper.toDomain(updatedItem) : undefined
  }

  async markAsValidatedByDocument({
    caseId,
    checklistItemId,
    documentFileId,
    documentFileName,
    validatedBy,
  }: Parameters<
    CaseChecklistItemsRepository['markAsValidatedByDocument']
  >[0]): ReturnType<CaseChecklistItemsRepository['markAsValidatedByDocument']> {
    const [updatedItem] = await this.database
      .update(caseChecklistItemModel)
      .set({
        documentFileId,
        documentFileName,
        status: CaseChecklistItemStatus.Validated,
        validatedAt: new Date(),
        validatedBy,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(caseChecklistItemModel.id, checklistItemId),
          eq(caseChecklistItemModel.caseId, caseId),
        ),
      )
      .returning()

    return updatedItem ? this.mapper.toDomain(updatedItem) : undefined
  }

  async hasPendingRequiredItems(
    caseId: string,
  ): ReturnType<CaseChecklistItemsRepository['hasPendingRequiredItems']> {
    const [pendingItem] = await this.database
      .select({ id: caseChecklistItemModel.id })
      .from(caseChecklistItemModel)
      .where(
        and(
          eq(caseChecklistItemModel.caseId, caseId),
          eq(caseChecklistItemModel.isRequired, true),
          inArray(caseChecklistItemModel.status, [
            CaseChecklistItemStatus.Pending,
            CaseChecklistItemStatus.InAnalysis,
          ]),
        ),
      )
      .limit(1)

    return Boolean(pendingItem)
  }

  async replaceForCase(
    caseId: string,
    checklistItems: Parameters<CaseChecklistItemsRepository['replaceForCase']>[1],
  ): ReturnType<CaseChecklistItemsRepository['replaceForCase']> {
    const currentItems = await this.database
      .select()
      .from(caseChecklistItemModel)
      .where(eq(caseChecklistItemModel.caseId, caseId))
      .orderBy(asc(caseChecklistItemModel.createdAt))

    for (const [index, item] of checklistItems.entries()) {
      const currentItem = currentItems[index]

      if (!currentItem) {
        await this.database.insert(caseChecklistItemModel).values({
          caseId,
          ...item,
        })
        continue
      }

      await this.database
        .update(caseChecklistItemModel)
        .set({
          templateItemKey: item.templateItemKey,
          title: item.title,
          isRequired: item.isRequired,
          status: CaseChecklistItemStatus.Pending,
          documentFileId: null,
          documentFileName: null,
          validatedAt: null,
          validatedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(caseChecklistItemModel.id, currentItem.id))
    }

    const extraItemIds = currentItems.slice(checklistItems.length).map((item) => item.id)

    if (extraItemIds.length > 0) {
      await this.database
        .delete(caseChecklistItemModel)
        .where(inArray(caseChecklistItemModel.id, extraItemIds))
    }

    return this.listByCaseId(caseId)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(caseChecklistItemModel)
  }
}
