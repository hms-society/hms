import { Injectable } from '@nestjs/common'
import { CaseChecklistItemStatus } from '@hms/core/case-management/domain/structures'
import type { CaseChecklistItemsRepository } from '@hms/core/case-management/interfaces'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'

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

  async markAsValidatedByDocument({
    checklistItemId,
    documentFileId,
    validatedBy,
  }: Parameters<
    CaseChecklistItemsRepository['markAsValidatedByDocument']
  >[0]): ReturnType<CaseChecklistItemsRepository['markAsValidatedByDocument']> {
    const [updatedItem] = await this.database
      .update(caseChecklistItemModel)
      .set({
        documentFileId,
        status: CaseChecklistItemStatus.Validated,
        validatedAt: new Date(),
        validatedBy,
        updatedAt: new Date(),
      })
      .where(eq(caseChecklistItemModel.id, checklistItemId))
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
          eq(caseChecklistItemModel.status, CaseChecklistItemStatus.Pending),
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
