import { Injectable } from '@nestjs/common'
import type { ChecklistTemplateItemsRepository } from '@hms/core/case-management/interfaces'
import { asc, eq, inArray } from 'drizzle-orm'

import {
  DrizzleChecklistTemplateItemMapper,
  serializeChecklistDocumentTypes,
} from '@/case-management/database/drizzle/mappers'
import { checklistTemplateItemModel } from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleChecklistTemplateItemsRepository
  extends DrizzleRepository
  implements ChecklistTemplateItemsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleChecklistTemplateItemMapper,
  ) {
    super(drizzle)
  }

  async addMany(
    checklistTemplateItems: Parameters<ChecklistTemplateItemsRepository['addMany']>[0],
  ): ReturnType<ChecklistTemplateItemsRepository['addMany']> {
    if (checklistTemplateItems.length === 0) return []

    const createdItems = await this.database
      .insert(checklistTemplateItemModel)
      .values(
        checklistTemplateItems.map(({ documentTypes, ...item }) => ({
          ...item,
          documentType: serializeChecklistDocumentTypes(documentTypes),
        })),
      )
      .returning()

    return createdItems.map((item) => this.mapper.toDomain(item))
  }

  async listByTemplateIds(
    checklistTemplateIds: readonly string[],
  ): ReturnType<ChecklistTemplateItemsRepository['listByTemplateIds']> {
    if (checklistTemplateIds.length === 0) return []

    const items = await this.database
      .select()
      .from(checklistTemplateItemModel)
      .where(
        inArray(checklistTemplateItemModel.checklistTemplateId, checklistTemplateIds),
      )
      .orderBy(
        asc(checklistTemplateItemModel.checklistTemplateId),
        asc(checklistTemplateItemModel.position),
      )

    return items.map((item) => this.mapper.toDomain(item))
  }

  async replaceForTemplate(
    checklistTemplateId: string,
    checklistTemplateItems: Parameters<
      ChecklistTemplateItemsRepository['replaceForTemplate']
    >[1],
  ): ReturnType<ChecklistTemplateItemsRepository['replaceForTemplate']> {
    await this.database
      .delete(checklistTemplateItemModel)
      .where(eq(checklistTemplateItemModel.checklistTemplateId, checklistTemplateId))

    return this.addMany(
      checklistTemplateItems.map((item) => ({
        checklistTemplateId,
        ...item,
      })),
    )
  }

  async removeAll(): Promise<void> {
    await this.database.delete(checklistTemplateItemModel)
  }
}
