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
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { eq } from 'drizzle-orm'

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

    const [record] = await db
      .insert(communicationModel)
      .values({
        clientId: body.clientId,
        authorId: req.user.id,
        channel: body.channel,
        direction: 'outbound',
        content: body.content,
      })
      .returning()

    return {
      id: record.id,
      channel: record.channel,
      direction: record.direction,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
      author: req.user.email || 'Advogado',
      externalId,
    }
  }
}
