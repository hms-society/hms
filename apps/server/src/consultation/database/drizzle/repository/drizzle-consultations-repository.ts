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

  private parseNullableDate(dateStr?: string | Date | null): Date | undefined {
    if (!dateStr) return undefined
    if (dateStr instanceof Date) {
      return Number.isNaN(dateStr.getTime()) ? undefined : dateStr
    }
    if (typeof dateStr === 'string' && !dateStr.trim()) return undefined
    const parsed = new Date(dateStr)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  private parseNullableString(str?: string | null): string | undefined {
    if (!str?.trim()) return undefined
    return str.trim()
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
        suggestions: true,
      },
    })

    if (!record) return null

    let responsibleCollaborator: any = null

    if (record.intake?.responsibleId) {
      const found = await this.db.query.collaboratorModel.findFirst({
        where: eq(schema.collaboratorModel.userId, record.intake.responsibleId),
      })

      responsibleCollaborator = found ?? null
    }

    return DrizzleConsultationMapper.toDomain({
      ...record,
      intake: record.intake
        ? {
            ...record.intake,
            responsible: responsibleCollaborator,
          }
        : undefined,
    } as any)
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
        suggestions: true,
      },
    })

    if (!record) return null

    let responsibleCollaborator: any = null

    if (record.intake?.responsibleId) {
      const found = await this.db.query.collaboratorModel.findFirst({
        where: eq(schema.collaboratorModel.userId, record.intake.responsibleId),
      })

      responsibleCollaborator = found ?? null
    }

    return DrizzleConsultationMapper.toDomain({
      ...record,
      intake: record.intake
        ? {
            ...record.intake,
            responsible: responsibleCollaborator,
          }
        : undefined,
    } as any)
  }
  async updateClientQualification(
    clientId: string,
    dto: UpdateClientQualificationDto,
  ): Promise<void> {
    const isLegal = Boolean(dto.legalName || dto.stateRegistration)
    const parsedBirthDate = this.parseNullableDate(dto.birthDate)
    const parsedConstitutionDate = this.parseNullableDate(dto.constitutionDate)

    const zipCode = this.parseNullableString(dto.zipCode)
    const street = this.parseNullableString(dto.street)
    const number = this.parseNullableString(dto.number)
    const complement = this.parseNullableString(dto.complement)
    const district = this.parseNullableString(dto.district)
    const city = this.parseNullableString(dto.city)
    const state = this.parseNullableString(dto.state)

    const hasCompleteAddress = Boolean(
      zipCode && street && number && district && city && state,
    )

    await this.db
      .update(schema.clientModel)
      .set({
        type: isLegal ? ('legal' as any) : ('natural' as any),
        taxIdType: isLegal ? ('cnpj' as any) : ('cpf' as any),
        taxIdValue: this.parseNullableString(dto.taxIdValue),
        name: isLegal ? undefined : this.parseNullableString(dto.name),
        legalName: isLegal ? this.parseNullableString(dto.legalName) : undefined,
        tradeName: this.parseNullableString(dto.tradeName),
        phone: this.parseNullableString(dto.phone),
        email: this.parseNullableString(dto.email),
        origin: this.parseNullableString(dto.origin),
        linkedThirdParty: this.parseNullableString(dto.linkedThirdParty),
        hmsResponsible: this.parseNullableString(dto.hmsResponsible),
        rg: this.parseNullableString(dto.rg),
        birthDate: parsedBirthDate ? (parsedBirthDate.toISOString() as any) : undefined,
        constitutionDate: parsedConstitutionDate
          ? (parsedConstitutionDate.toISOString() as any)
          : undefined,
        maritalStatus: this.parseNullableString(dto.maritalStatus),
        nationality: this.parseNullableString(dto.nationality),
        profession: this.parseNullableString(dto.profession),
        stateRegistration: this.parseNullableString(dto.stateRegistration),
        legalNature: this.parseNullableString(dto.legalNature),
        legalRepresentative: this.parseNullableString(dto.legalRepresentative),
        representativeRole: this.parseNullableString(dto.representativeRole),

        zipCode: hasCompleteAddress ? zipCode : undefined,
        street: hasCompleteAddress ? street : undefined,
        number: hasCompleteAddress ? number : undefined,
        complement: hasCompleteAddress ? complement : undefined,
        district: hasCompleteAddress ? district : undefined,
        city: hasCompleteAddress ? city : undefined,
        state: hasCompleteAddress ? state : undefined,

        updatedAt: new Date(),
      })
      .where(eq(schema.clientModel.id, clientId))
  }

  async save(consultation: Consultation): Promise<void> {
    const rawData = DrizzleConsultationMapper.toPersistence(consultation)

    await this.db.insert(schema.consultationModel).values(rawData).onConflictDoUpdate({
      target: schema.consultationModel.id,
      set: rawData,
    })

    await this.db
      .delete(schema.consultationRelevantFactModel)
      .where(eq(schema.consultationRelevantFactModel.consultationId, consultation.id))

    if (consultation.relevantFacts.length > 0) {
      await this.db.insert(schema.consultationRelevantFactModel).values(
        consultation.relevantFacts.map((fact) => ({
          id: fact.id,
          consultationId: consultation.id,
          description: fact.description,
          occurredOn: fact.occurredOn ?? null,
        })),
      )
    }

    await this.db
      .delete(schema.consultationPotentialLegalRequestModel)
      .where(
        eq(schema.consultationPotentialLegalRequestModel.consultationId, consultation.id),
      )

    if (consultation.potentialLegalRequests.length > 0) {
      await this.db.insert(schema.consultationPotentialLegalRequestModel).values(
        consultation.potentialLegalRequests.map((req) => ({
          id: req.id,
          consultationId: consultation.id,
          description: req.description,
          summary: req.summary ?? null,
        })),
      )
    }
  }
}
