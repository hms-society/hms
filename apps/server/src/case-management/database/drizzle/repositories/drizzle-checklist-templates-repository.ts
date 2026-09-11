import { Injectable } from '@nestjs/common'
import type { ChecklistTemplatesRepository } from '@hms/core/case-management/interfaces'
import { eq } from 'drizzle-orm'

import { DrizzleChecklistTemplateMapper } from '@/case-management/database/drizzle/mappers'
import { checklistTemplateModel } from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleChecklistTemplatesRepository
  extends DrizzleRepository
  implements ChecklistTemplatesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleChecklistTemplateMapper,
  ) {
    super(drizzle)
  }

  async add(
    template: Parameters<ChecklistTemplatesRepository['add']>[0],
  ): ReturnType<ChecklistTemplatesRepository['add']> {
    const [createdTemplate] = await this.database
      .insert(checklistTemplateModel)
      .values(template)
      .returning()

    return this.mapper.toDomain(createdTemplate)
  }

  async findByLegalAreaId(
    legalAreaId: string,
  ): ReturnType<ChecklistTemplatesRepository['findByLegalAreaId']> {
    const [template] = await this.database
      .select()
      .from(checklistTemplateModel)
      .where(eq(checklistTemplateModel.legalAreaId, legalAreaId))
      .limit(1)

    return template ? this.mapper.toDomain(template) : undefined
  }

  async list(): ReturnType<ChecklistTemplatesRepository['list']> {
    const templates = await this.database.select().from(checklistTemplateModel)

    return templates.map((template) => this.mapper.toDomain(template))
  }

  async replace(
    checklistTemplateId: string,
    changes: Parameters<ChecklistTemplatesRepository['replace']>[1],
  ): ReturnType<ChecklistTemplatesRepository['replace']> {
    const [updatedTemplate] = await this.database
      .update(checklistTemplateModel)
      .set({
        ...changes,
        updatedAt: new Date(),
      })
      .where(eq(checklistTemplateModel.id, checklistTemplateId))
      .returning()

    return updatedTemplate ? this.mapper.toDomain(updatedTemplate) : undefined
  }

  async removeAll(): Promise<void> {
    await this.database.delete(checklistTemplateModel)
  }
}
