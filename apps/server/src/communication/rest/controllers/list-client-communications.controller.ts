import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import type { PrivateMessagesRepository } from '@hms/core/communication/interfaces'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard } from '@/identity/guards'

@Controller('communications')
@UseGuards(AuthGuard)
export class ListClientCommunicationsController {
  constructor(
    @Inject(COMMUNICATION_REPOSITORIES.privateMessages)
    private readonly privateMessagesRepository: PrivateMessagesRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  @Get('clients/:clientId')
  async handle(@Param('clientId') clientId: string) {
    const records = await this.privateMessagesRepository.findByClientId(clientId)

    return Promise.all(
      records.map(async (record) => {
        const author =
          record.direction === 'outgoing'
            ? await this.collaboratorsRepository.findById(record.collaboratorId)
            : undefined

        return {
          id: record.id,
          channel: 'whatsapp' as const,
          direction: record.direction === 'incoming' ? 'inbound' : 'outbound',
          content: record.content ?? '',
          createdAt: record.createdAt.toISOString(),
          author:
            record.direction === 'outgoing'
              ? (author?.professionalName ?? 'Advogado')
              : 'Cliente',
        }
      }),
    )
  }
}
