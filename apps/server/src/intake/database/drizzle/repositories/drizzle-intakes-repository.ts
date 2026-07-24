import { Injectable } from '@nestjs/common'
import type {
  IntakesRepository,
  UpdateIntakesRepositoryParams,
} from '@hms/core/intake/interfaces'
import { and, desc, eq, sql } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle-repository'
import { DrizzleIntakeMapper } from '@/intake/database/drizzle/mappers/drizzle-intake-mapper'
import { intakeModel } from '@/intake/database/drizzle/models'

@Injectable()
export class DrizzleIntakesRepository
  extends DrizzleRepository
  implements IntakesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly intakeMapper: DrizzleIntakeMapper,
  ) {
    super(drizzle)
  }

  async add(
    intake: Parameters<IntakesRepository['add']>[0],
  ): ReturnType<IntakesRepository['add']> {
    const [createdIntake] = await this.database
      .insert(intakeModel)
      .values(intake)
      .returning()

    if (!createdIntake) {
      throw new Error('Intake was not created')
    }

    return this.intakeMapper.toDomain(createdIntake)
  }

  async addMany(
    intakes: Parameters<IntakesRepository['addMany']>[0],
  ): ReturnType<IntakesRepository['addMany']> {
    if (intakes.length === 0) return []

    const createdIntakes = await this.database
      .insert(intakeModel)
      .values(intakes)
      .returning()

    return createdIntakes.map((intake) => this.intakeMapper.toDomain(intake))
  }

  async findById(intakeId: string): ReturnType<IntakesRepository['findById']> {
    const [intake] = await this.database
      .select()
      .from(intakeModel)
      .where(eq(intakeModel.id, intakeId))
      .limit(1)

    return intake ? this.intakeMapper.toDomain(intake) : undefined
  }

  async findBySequenceNumber(
    sequenceNumber: number,
  ): ReturnType<IntakesRepository['findBySequenceNumber']> {
    const [intake] = await this.database
      .select()
      .from(intakeModel)
      .where(eq(intakeModel.sequenceNumber, sequenceNumber))
      .limit(1)

    return intake ? this.intakeMapper.toDomain(intake) : undefined
  }

  async findByClientId(
    clientId: string,
  ): ReturnType<IntakesRepository['findByClientId']> {
    const records = await this.database
      .select()
      .from(intakeModel)
      .where(eq(intakeModel.clientId, clientId))
      .orderBy(desc(intakeModel.createdAt))

    return records.map((record) => this.intakeMapper.toDomain(record))
  }

  async replace({
    intakeId,
    expectedVersion,
    changes,
  }: UpdateIntakesRepositoryParams): ReturnType<IntakesRepository['replace']> {
    const [updatedIntake] = await this.database
      .update(intakeModel)
      .set({
        ...changes,
        updatedAt: new Date(),
        version: sql`${intakeModel.version} + 1`,
      })
      .where(and(eq(intakeModel.id, intakeId), eq(intakeModel.version, expectedVersion)))
      .returning()

    return updatedIntake ? this.intakeMapper.toDomain(updatedIntake) : undefined
  }
}
