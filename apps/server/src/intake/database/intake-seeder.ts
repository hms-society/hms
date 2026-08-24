import { Inject, Injectable } from '@nestjs/common'
import type { Intake, IntakeCreation } from '@hms/core/intake/domain/entities'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'

export type IntakeSeedReferences = {
  readonly clientIds: readonly string[]
  readonly documentProductionClientId: string
  readonly kauanClientId?: string
  readonly lawyerId?: string
  readonly responsibleId: string
  readonly actorId: string
  readonly legalAreaId: string
  readonly legalTopicId: string
}

@Injectable()
export class IntakeSeeder {
  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
  ) {}

  seed(intakes: IntakeCreation[] = []) {
    return this.intakesRepository.addMany(intakes)
  }

  clear() {
    return this.intakesRepository.removeAll()
  }

  async run(references: IntakeSeedReferences) {
    if (!references.clientIds.includes(references.documentProductionClientId)) {
      throw new AppError(
        'The document-production Client must belong to the Intake seed references.',
        'Seed Error',
      )
    }

    const documentProductionIntake = this.createIntake({
      clientId: references.documentProductionClientId,
      responsibleId: references.responsibleId,
      createdBy: references.actorId,
      updatedBy: references.actorId,
      origin: 'direct',
      contactChannel: 'whatsapp',
      legalAreaId: references.legalAreaId,
      legalTopicId: references.legalTopicId,
      urgency: 'normal',
      demandNotes:
        'The client needs representation to review and negotiate a residential lease agreement.',
      status: IntakeStatus.ConsultationScheduled,
    })

    const kauanIntake = references.kauanClientId
      ? this.createIntake({
          clientId: references.kauanClientId,
          responsibleId: references.lawyerId ?? references.responsibleId,
          createdBy: references.actorId,
          updatedBy: references.actorId,
          origin: 'direct',
          contactChannel: 'whatsapp',
          legalAreaId: references.legalAreaId,
          legalTopicId: references.legalTopicId,
          urgency: 'high',
          demandNotes: 'Atendimento via WhatsApp - Cliente Kauan.',
          status: IntakeStatus.ConsultationScheduled,
        })
      : null

    const additionalIntakes = references.clientIds
      .filter(
        (clientId) =>
          clientId !== references.documentProductionClientId &&
          clientId !== references.kauanClientId,
      )
      .flatMap((clientId, index) => {
        if (index === 0) {
          return [
            this.createIntake({
              clientId,
              responsibleId: references.responsibleId,
              createdBy: references.actorId,
              updatedBy: references.actorId,
              origin: 'direct',
              contactChannel: 'whatsapp',
              legalAreaId: references.legalAreaId,
              legalTopicId: references.legalTopicId,
              urgency: 'normal',
              demandNotes: 'Cliente solicita análise de contrato de aluguel residencial.',
              status: IntakeStatus.Contracted,
            }),
            this.createIntake({
              clientId,
              responsibleId: references.responsibleId,
              createdBy: references.actorId,
              updatedBy: references.actorId,
              origin: 'direct',
              contactChannel: 'whatsapp',
              legalAreaId: references.legalAreaId,
              legalTopicId: references.legalTopicId,
              urgency: 'high',
              demandNotes: 'Demissão sem justa causa, verbas rescisórias não pagas.',
              status: IntakeStatus.Registered,
            }),
            this.createIntake({
              clientId,
              responsibleId: references.responsibleId,
              createdBy: references.actorId,
              updatedBy: references.actorId,
              origin: 'direct',
              contactChannel: 'email',
              legalAreaId: references.legalAreaId,
              legalTopicId: references.legalTopicId,
              urgency: 'normal',
              demandNotes: 'Divórcio consensual e partilha de bens.',
              status: IntakeStatus.InFormalization,
            }),
          ]
        }

        const contactChannels = ['phone', 'whatsapp', 'email', 'in_person'] as const
        const demandNotes = [
          'Consulta inicial sobre revisão contratual e obrigações pendentes.',
          'Cliente relata conflito familiar e necessidade de orientação preventiva.',
          'Análise preliminar sobre cobrança indevida e documentação disponível.',
          'Pedido de orientação sobre direitos trabalhistas e próximos passos.',
        ]
        const urgencies = ['normal', 'high', 'urgent'] as const

        return [
          this.createIntake({
            clientId,
            responsibleId: references.responsibleId,
            createdBy: references.actorId,
            updatedBy: references.actorId,
            origin: 'direct',
            contactChannel: contactChannels[index % contactChannels.length],
            legalAreaId: references.legalAreaId,
            legalTopicId: references.legalTopicId,
            urgency: urgencies[index % urgencies.length],
            demandNotes: demandNotes[index % demandNotes.length],
            status: IntakeStatus.Contracted,
          }),
        ]
      })

    const intakesToSeed = [documentProductionIntake, ...additionalIntakes]
    if (kauanIntake) {
      intakesToSeed.push(kauanIntake)
    }
    const intakes = await this.seed(intakesToSeed)
    const createdDocumentProductionIntake = intakes.find(
      ({ clientId, status }) =>
        clientId === references.documentProductionClientId &&
        status === IntakeStatus.ConsultationScheduled,
    )

    if (!createdDocumentProductionIntake) {
      throw new AppError(
        'The document-production Intake could not be seeded.',
        'Seed Error',
      )
    }

    return { intakes, documentProductionIntake: createdDocumentProductionIntake }
  }

  private createIntake(overrides: Partial<Intake>): IntakeCreation {
    const {
      id: _id,
      sequenceNumber: _sequenceNumber,
      version: _version,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...creation
    } = IntakeFaker.fake({
      closureReason: undefined,
      closureNotes: undefined,
      closedAt: undefined,
      ...overrides,
    })

    return creation
  }
}
