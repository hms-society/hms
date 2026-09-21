import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  Req,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { AuthGuard } from '@/identity/guards'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'
import { SendCommunicationDto } from '../dtos/send-communication.dto'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { eq, desc } from 'drizzle-orm'
import { encrypt } from '@/shared/utils/crypto'

import { EnvProvider } from '@/shared/provision/env/env-provider'

@Controller('communications')
@UseGuards(AuthGuard)
export class SendCommunicationController {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly whatsappProvider: WhatsappProvider,
    private readonly envProvider: EnvProvider,
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
    if (body.type === 'template' && body.channel !== 'whatsapp') {
      throw new BadRequestException(
        'Template messages are only supported for the WhatsApp channel',
      )
    }

    const db = this.drizzleClient.requireDatabase()

    const [client] = await db
      .select({
        id: clientModel.id,
        phone: clientModel.phone,
      })
      .from(clientModel)
      .where(eq(clientModel.id, body.clientId))
      .limit(1)

    if (!client) {
      throw new NotFoundException('Client not found')
    }

    const [collaborator] = await db
      .select({
        id: collaboratorModel.id,
        professionalName: collaboratorModel.professionalName,
      })
      .from(collaboratorModel)
      .where(eq(collaboratorModel.userId, req.user.id))
      .limit(1)

    const [intake] = await db
      .select({
        id: intakeModel.id,
      })
      .from(intakeModel)
      .where(eq(intakeModel.clientId, body.clientId))
      .orderBy(desc(intakeModel.createdAt))
      .limit(1)

    let externalId: string | undefined

    if (body.channel === 'whatsapp') {
      if (!client.phone) {
        throw new BadRequestException('Client has no phone number registered')
      }

      if (body.type === 'template') {
        const templateName =
          body.templateName ||
          this.envProvider.get('WHATSAPP_START_WINDOW_TEMPLATE_NAME') ||
          'inicio_atendimento_ola'
        const result = await this.whatsappProvider.sendTemplateMessage(
          client.phone,
          templateName,
        )
        externalId = result.externalMessageId
      } else {
        const result = await this.whatsappProvider.sendTextMessage(
          client.phone,
          body.content,
        )
        externalId = result.externalMessageId
      }
    }

    const contentToSave =
      body.type === 'template'
        ? 'Olá! Gostaria de falar sobre o seu caso. Podemos conversar?'
        : body.content

    const [record] = await db
      .insert(privateMessageModel)
      .values({
        clientId: body.clientId,
        collaboratorId: collaborator?.id || req.user.id,
        intakeId: intake?.id || body.clientId,
        clientPhone: client.phone,
        direction: 'outbound',
        content: encrypt(contentToSave),
      })
      .returning()

    return {
      id: record.id,
      channel: body.channel,
      direction: record.direction,
      content: contentToSave,
      createdAt: record.createdAt.toISOString(),
      author: collaborator?.professionalName || req.user.email || 'Advogado',
      externalId,
    }
  }
}
