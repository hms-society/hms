import { Injectable } from '@nestjs/common'
import type { DynamicForm, DynamicFormCreation } from '@hms/core/shared/domain'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { dynamicFormModel } from '@/shared/database/drizzle/models/dynamic-form-model'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleDynamicFormMapper } from '@/shared/database/drizzle/mappers'

@Injectable()
export class DrizzleDynamicFormsRepository
  extends DrizzleRepository
  implements DynamicFormsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly dynamicFormMapper: DrizzleDynamicFormMapper,
  ) {
    super(drizzle)
  }

  async list(): Promise<DynamicForm[]> {
    const records = await this.database.select().from(dynamicFormModel)

    return records.map((record) => this.dynamicFormMapper.toDomain(record))
  }

  async addMany(forms: readonly DynamicFormCreation[]): Promise<DynamicForm[]> {
    if (forms.length === 0) return []

    const records = await this.database
      .insert(dynamicFormModel)
      .values(
        forms.map((form) => ({
          ...form,
          contexts: [...form.contexts],
          fields: [...form.fields],
        })),
      )
      .returning()

    return records.map((record) => this.dynamicFormMapper.toDomain(record))
  }

  async removeAll() {
    await this.database.delete(dynamicFormModel)
  }
}
