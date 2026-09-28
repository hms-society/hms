import { Injectable } from '@nestjs/common'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type {
  ConsultationUpdate,
  ConsultationsRepository,
} from '@hms/core/consultation/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq } from 'drizzle-orm'

import { DrizzleConsultationMapper } from '@/consultation/database/drizzle/mappers'
import { consultationModel } from '@/consultation/database/drizzle/models'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleConsultationsRepository
  extends DrizzleRepository
  implements ConsultationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleConsultationMapper,
    private readonly transactionContext: DatabaseTransactionContext,
  ) {
    super(drizzle)
  }

  private get executor() {
    return this.transactionContext.get() ?? this.database
  }

  async add(consultation: Consultation) {
    const [record] = await this.executor
      .insert(consultationModel)
      .values({ ...consultation })
      .onConflictDoNothing({ target: consultationModel.intakeId })
      .returning()

    if (record) return this.mapper.toDomain(record)

    const existingConsultation = await this.findByIntakeId(consultation.intakeId)

    if (!existingConsultation) {
      throw new AppError(
        'The Consultation could not be persisted.',
        'Consultation Persistence Error',
      )
    }

    return existingConsultation
  }

  async addMany(consultations: readonly Consultation[]) {
    if (consultations.length === 0) return []

    const records = await this.executor
      .insert(consultationModel)
      .values(consultations.map((consultation) => ({ ...consultation })))
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async findById(consultationId: string) {
    const [record] = await this.executor
      .select()
      .from(consultationModel)
      .where(eq(consultationModel.id, consultationId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findByIntakeId(intakeId: string) {
    const [record] = await this.executor
      .select()
      .from(consultationModel)
      .where(eq(consultationModel.intakeId, intakeId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async replace(consultationId: string, changes: ConsultationUpdate) {
    const [record] = await this.executor
      .update(consultationModel)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(consultationModel.id, consultationId))
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.executor.delete(consultationModel)
  }
}
