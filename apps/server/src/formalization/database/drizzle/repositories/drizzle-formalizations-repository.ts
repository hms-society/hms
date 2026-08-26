import { Injectable, Optional } from '@nestjs/common'
import type {
  FormalizationCreation,
  FormalizationsRepository,
  ReplaceFormalizationParams,
} from '@hms/core/formalization'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, eq, sql } from 'drizzle-orm'

import { DrizzleFormalizationMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationModel } from '@/formalization/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleFormalizationsRepository
  extends DrizzleRepository
  implements FormalizationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationMapper,
    @Optional()
    databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationsRepository(this.drizzleClient, this.mapper, database)
  }

  async findById(formalizationId: string) {
    const [record] = await this.database
      .select()
      .from(formalizationModel)
      .where(eq(formalizationModel.id, formalizationId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findByIntakeId(intakeId: string) {
    const [record] = await this.database
      .select()
      .from(formalizationModel)
      .where(eq(formalizationModel.intakeId, intakeId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async addOrGet(formalization: FormalizationCreation) {
    const [created] = await this.database
      .insert(formalizationModel)
      .values(formalization)
      .onConflictDoNothing({ target: formalizationModel.intakeId })
      .returning()

    if (created) return this.mapper.toDomain(created)

    const existing = await this.findByIntakeId(formalization.intakeId)
    if (!existing) {
      throw new AppError(
        'A formalização não pôde ser persistida.',
        'Erro de Persistência',
      )
    }

    return existing
  }

  async replace({
    formalizationId,
    expectedVersion,
    changes,
  }: ReplaceFormalizationParams) {
    const update: Record<string, unknown> = {
      updatedAt: new Date(),
      version: sql`${formalizationModel.version} + 1`,
    }

    for (const [key, value] of Object.entries(changes)) {
      if (
        key === 'contractFormClosedAt' ||
        key === 'documentsConfirmedAt' ||
        key === 'cancelledAt'
      ) {
        update[key] = value ?? null
      } else if (
        key === 'contractFormClosedByCollaboratorId' ||
        key === 'documentsConfirmedByCollaboratorId' ||
        key === 'documentsConfirmedRevision' ||
        key === 'cancelledByCollaboratorId'
      ) {
        update[key] = value ?? null
      } else {
        update[key] = value
      }
    }

    const [record] = await this.database
      .update(formalizationModel)
      .set(update)
      .where(
        and(
          eq(formalizationModel.id, formalizationId),
          eq(formalizationModel.version, expectedVersion),
        ),
      )
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.database.delete(formalizationModel)
  }
}
