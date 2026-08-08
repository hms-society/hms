import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import * as schema from '@/shared/database/drizzle/schema'
import { DrizzleConsultationMapper } from '../mappers/drizzle-consultation-mapper'
import type { UpdateClientQualificationDto } from '../rest/controllers/dto/update-client-qualification.dto'

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
        assignedLawyer: true,
        intake: true,
        client: true,
        legalArea: true,
        legalTopic: true,
        facts: true,
        potentialRequests: true,
        identifiedRisks: true,
        suggestions: true,
      },
    })

    if (!record) return null

    console.log('intake raw:', JSON.stringify(record.intake, null, 2))

    return DrizzleConsultationMapper.toDomain(record as any)
  }

  async findByAppointmentId(appointmentId: string): Promise<Consultation | null> {
    const record = await this.db.query.consultationModel.findFirst({
      where: eq(schema.consultationModel.appointmentId, appointmentId),
      with: {
        assignedLawyer: true,
        intake: true,
        client: true,
        legalArea: true,
        legalTopic: true,
        facts: true,
        potentialRequests: true,
        identifiedRisks: true,
        suggestions: true,
      },
    })

    if (!record) return null

    return DrizzleConsultationMapper.toDomain(record as any)
  }

 async updateClientQualification(
  clientId: string,
  dto: UpdateClientQualificationDto,
): Promise<void> {
  const isLegal = Boolean(dto.legalName || dto.stateRegistration)

  await this.db
    .update(schema.clientModel)
    .set({
      type: isLegal ? ('legal' as any) : ('natural' as any),
      taxIdType: isLegal ? ('cnpj' as any) : ('cpf' as any),
      taxIdValue: dto.taxIdValue,
      name: isLegal ? null : dto.name,
      legalName: isLegal ? dto.legalName : null,
      tradeName: dto.tradeName,
      phone: dto.phone,
      email: dto.email,
      origin: dto.origin,
      linkedThirdParty: dto.linkedThirdParty,
      hmsResponsible: dto.hmsResponsible,
      rg: dto.rg,
      birthDate: dto.birthDate,
      maritalStatus: dto.maritalStatus,
      nationality: dto.nationality,
      profession: dto.profession,
      stateRegistration: dto.stateRegistration,
      constitutionDate: dto.constitutionDate,
      legalNature: dto.legalNature,
      legalRepresentative: dto.legalRepresentative,
      representativeRole: dto.representativeRole,
      zipCode: dto.zipCode,
      street: dto.street,
      number: dto.number,
      complement: dto.complement,
      district: dto.district,
      city: dto.city,
      state: dto.state,

      updatedAt: new Date(),
    })
    .where(eq(schema.clientModel.id, clientId))
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