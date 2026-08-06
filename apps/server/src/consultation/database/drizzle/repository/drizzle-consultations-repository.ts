import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import * as schema from '@/shared/database/drizzle/schema'
import { DrizzleConsultationMapper } from '../mappers/drizzle-consultation-mapper'

@Injectable()
export class DrizzleConsultationsRepository implements ConsultationsRepository {
  constructor(private readonly drizzleClient: DrizzleClient) {}

  private get db() {
    return this.drizzleClient.requireDatabase()
  }

  async findById(id: string): Promise<Consultation | null> {
    const record = await this.db.query.consultationModel.findFirst({
      where: eq(schema.consultationModel.id, id),
      with: {
        facts: true,
        potentialRequests: true,
        identifiedRisks: true,
        suggestions: true,
      },
    })

    if (!record) return null

    return DrizzleConsultationMapper.toDomain(record as any)
  }

  async findByAppointmentId(appointmentId: string): Promise<Consultation | null> {
    const record = await this.db.query.consultationModel.findFirst({
      where: eq(schema.consultationModel.appointmentId, appointmentId),
      with: {
        facts: true,
        potentialRequests: true,
        identifiedRisks: true,
        suggestions: true,
      },
    })

    if (!record) return null

    return DrizzleConsultationMapper.toDomain(record as any)
  }

  async save(consultation: Consultation): Promise<void> {
    const rawData = DrizzleConsultationMapper.toPersistence(consultation)

    await this.db
      .insert(schema.consultationModel)
      .values(rawData)
      .onConflictDoUpdate({
        target: schema.consultationModel.id,
        set: rawData,
      })

    if (consultation.relevantFacts.length > 0) {
      await this.db
        .insert(schema.consultationRelevantFactModel)
        .values(
          consultation.relevantFacts.map((fact) => ({
            id: fact.id,
            consultationId: consultation.id,
            description: fact.description,
            occurredOn: fact.occurredOn ?? null,
          })),
        )
        .onConflictDoNothing()
    }

    if (consultation.potentialLegalRequests.length > 0) {
      await this.db
        .insert(schema.consultationPotentialLegalRequestModel)
        .values(
          consultation.potentialLegalRequests.map((req) => ({
            id: req.id,
            consultationId: consultation.id,
            description: req.description,
          })),
        )
        .onConflictDoNothing()
    }

    if (consultation.identifiedRisks.length > 0) {
      await this.db
        .insert(schema.consultationIdentifiedRiskModel)
        .values(
          consultation.identifiedRisks.map((risk) => ({
            id: risk.id,
            consultationId: consultation.id,
            description: risk.description,
          })),
        )
        .onConflictDoNothing()
    }
  }
}