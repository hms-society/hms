import {
  Controller,
  Post,
  Body,
  Inject,
  UseGuards,
  UsePipes,
  Req,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import type { PrivateMessagesRepository } from '@hms/core/communication/interfaces'
import type {
  ClientsRepository,
  CollaboratorsRepository,
} from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard } from '@/identity/guards'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'
import { SendCommunicationDto } from '../dtos/send-communication.dto'

@Controller('communications')
@UseGuards(AuthGuard)
export class SendCommunicationController {
  constructor(
    @Inject(COMMUNICATION_REPOSITORIES.privateMessages)
    private readonly privateMessagesRepository: PrivateMessagesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
    private readonly whatsappProvider: WhatsappProvider,
  ) {}

  @Post('send')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The communication was sent successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The input data is invalid.',
  })
  @UsePipes(ZodValidationPipe)
  async handle(@Body() body: SendCommunicationDto, @Req() req: any) {
    const client = await this.clientsRepository.findById(body.clientId)

    if (!client) {
      throw new NotFoundException('Client not found')
    }

    const collaborator = await this.collaboratorsRepository.findByUserId(req.user.id)

    const [intake] = await this.intakesRepository.findByClientId(body.clientId)

    let externalId: string | undefined

    if (body.channel === 'whatsapp') {
      if (!client.phone) {
        throw new BadRequestException('Client has no phone number registered')
      }
      const result = await this.whatsappProvider.sendTextMessage(
        client.phone,
        body.content,
      )
      externalId = result.externalMessageId
    }

    const record = await this.privateMessagesRepository.add({
      clientId: body.clientId,
      collaboratorId: collaborator?.id || req.user.id,
      intakeId: intake?.id || body.clientId,
      clientPhone: client.phone,
      direction: 'outgoing',
      content: body.content,
      fileIds: [],
    })

    return {
      id: record.id,
      channel: body.channel,
      direction: 'outbound',
      content: record.content ?? body.content,
      createdAt: record.createdAt.toISOString(),
      author: collaborator?.professionalName || req.user.email || 'Advogado',
      externalId,
    }
  }
}
