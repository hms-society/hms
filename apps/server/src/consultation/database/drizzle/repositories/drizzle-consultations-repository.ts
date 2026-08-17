import { Injectable } from '@nestjs/common'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq } from 'drizzle-orm'

import { DrizzleConsultationMapper } from '@/consultation/database/drizzle/mappers'
import { consultationModel } from '@/consultation/database/drizzle/models'
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
  ) {
    super(drizzle)
  }

  async add(consultation: Consultation) {
    const [record] = await this.database
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

    const records = await this.database
      .insert(consultationModel)
      .values(consultations.map((consultation) => ({ ...consultation })))
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async findById(consultationId: string) {
    const [record] = await this.database
      .select()
      .from(consultationModel)
      .where(eq(consultationModel.id, consultationId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findByIntakeId(intakeId: string) {
    const [record] = await this.database
      .select()
      .from(consultationModel)
      .where(eq(consultationModel.intakeId, intakeId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.database.delete(consultationModel)
  }
}
