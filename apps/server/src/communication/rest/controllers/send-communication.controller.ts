import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { desc, eq } from 'drizzle-orm'
import { ZodValidationPipe } from 'nestjs-zod'

import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { AuthGuard } from '@/identity/guards'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { encrypt } from '@/shared/utils/crypto'

import { SendCommunicationDto } from '../dtos/send-communication.dto'

@Controller('communications')
@UseGuards(AuthGuard)
export class SendCommunicationController {
  constructor(
    private readonly drizzleClient: DrizzleClient,
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
      try {
        const result = await this.whatsappProvider.sendTextMessage(
          client.phone,
          body.content,
        )
        externalId = result.externalMessageId
      } catch (error: any) {
        throw new BadRequestException(
          `Falha ao enviar mensagem de WhatsApp: ${error.message || error}`,
        )
      }
    }

    const [record] = await db
      .insert(privateMessageModel)
      .values({
        clientId: body.clientId,
        collaboratorId: collaborator?.id || req.user.id,
        intakeId: intake?.id || body.clientId,
        clientPhone: client.phone,
        direction: 'outbound',
        content: encrypt(body.content),
      })
      .returning()

    return {
      id: record.id,
      channel: body.channel,
      direction: record.direction,
      content: body.content,
      createdAt: record.createdAt.toISOString(),
      author: collaborator?.professionalName || req.user.email || 'Advogado',
      externalId,
    }
  }
}
