import { Inject, Injectable } from '@nestjs/common'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import type { IntakeCreation } from '@hms/core/intake/domain/entities'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'

export type IntakeSeedReferences = {
  clientIds: readonly string[]
  responsibleIds: readonly string[]
  actorIds: readonly string[]
  legalAreaId: string
  legalTopicId: string
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

  run(references?: IntakeSeedReferences) {
    if (!references) {
      throw new AppError('Intake seed references are required')
    }

    const [responsibleId] = references.responsibleIds
    const actorId = references.actorIds[0] ?? responsibleId

    if (!responsibleId || !actorId || references.clientIds.length === 0) {
      throw new AppError('Intake seed requirements are not met')
    }

    const intakesToSeed = this.createClientCaseSeeds({
      actorId,
      references,
      responsibleId,
    })

    return this.seed(intakesToSeed)
  }

  private createClientCaseSeeds({
    actorId,
    references,
    responsibleId,
  }: {
    actorId: string
    references: IntakeSeedReferences
    responsibleId: string
  }): IntakeCreation[] {
    return references.clientIds.flatMap((clientId, index) => {
      if (index === 0) {
        return [
          this.createCaseSeed({
            actorId,
            clientId,
            contactChannel: 'whatsapp',
            demandNotes: 'Cliente solicita análise de contrato de aluguel residencial.',
            references,
            responsibleId,
            status: IntakeStatus.Contracted,
            urgency: 'normal',
          }),
          this.createCaseSeed({
            actorId,
            clientId,
            contactChannel: 'whatsapp',
            demandNotes: 'Demissão sem justa causa, verbas rescisórias não pagas.',
            references,
            responsibleId,
            status: IntakeStatus.Registered,
            urgency: 'high',
          }),
          this.createCaseSeed({
            actorId,
            clientId,
            contactChannel: 'email',
            demandNotes: 'Divórcio consensual e partilha de bens.',
            references,
            responsibleId,
            status: IntakeStatus.InFormalization,
            urgency: 'normal',
          }),
        ]
      }

      return [
        this.createCaseSeed({
          actorId,
          clientId,
          contactChannel: this.getContactChannelByIndex(index),
          demandNotes: this.getDemandNotesByIndex(index),
          references,
          responsibleId,
          status: IntakeStatus.Contracted,
          urgency: this.getUrgencyByIndex(index),
        }),
      ]
    })
  }

  private createCaseSeed({
    actorId,
    clientId,
    contactChannel,
    demandNotes,
    references,
    responsibleId,
    status,
    urgency,
  }: {
    actorId: string
    clientId: string
    contactChannel: IntakeCreation['contactChannel']
    demandNotes: string
    references: IntakeSeedReferences
    responsibleId: string
    status: IntakeCreation['status']
    urgency: IntakeCreation['urgency']
  }): IntakeCreation {
    return {
      clientId,
      responsibleId,
      createdBy: actorId,
      updatedBy: actorId,
      origin: 'direct',
      contactChannel,
      legalAreaId: references.legalAreaId,
      legalTopicId: references.legalTopicId,
      urgency,
      demandNotes,
      status,
    }
  }

  private getContactChannelByIndex(index: number): IntakeCreation['contactChannel'] {
    const contactChannels = ['phone', 'whatsapp', 'email', 'in_person'] as const

    return contactChannels[index % contactChannels.length]
  }

  private getDemandNotesByIndex(index: number): string {
    const demandNotes = [
      'Consulta inicial sobre revisão contratual e obrigações pendentes.',
      'Cliente relata conflito familiar e necessidade de orientação preventiva.',
      'Análise preliminar sobre cobrança indevida e documentação disponível.',
      'Pedido de orientação sobre direitos trabalhistas e próximos passos.',
    ]

    return demandNotes[index % demandNotes.length] ?? demandNotes[0]
  }

  private getUrgencyByIndex(index: number): IntakeCreation['urgency'] {
    const urgencies = ['normal', 'high', 'urgent'] as const

    return urgencies[index % urgencies.length] ?? 'normal'
  }
}
