import { Inject, Injectable, Logger } from '@nestjs/common'
import { INTEGRATION_EVENT_STATUS, INTEGRATION_PROVIDERS } from '@hms/core/communication/constants'
import { eq } from 'drizzle-orm'

import { DRIZZLE, type DrizzleDB } from '../../shared/database/database.provider'
import { integracaoEventos } from '../../shared/database/schema'

export interface WebhookResult {
  received: boolean
  duplicate: boolean
  id?: string
}

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name)

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async processWebhook(payload: Record<string, any>): Promise<WebhookResult> {
    const tipoEvento = payload.event || payload.type || 'UNKNOWN'
    const idExterno: string | null =
      payload.data?.key?.id || payload.data?.id || payload.id || null

    if (idExterno) {
      const existing = await this.db
        .select()
        .from(integracaoEventos)
        .where(eq(integracaoEventos.idExterno, idExterno))
        .limit(1)

      if (existing.length > 0) {
        this.logger.warn(
          `Evento de integração duplicado recebido (idExterno: ${idExterno}). Ignorando reprocessamento.`
        )
        return {
          received: true,
          duplicate: true,
          id: existing[0].id,
        }
      }
    }

    const [novoEvento] = await this.db
      .insert(integracaoEventos)
      .values({
        provedor: INTEGRATION_PROVIDERS.EVOLUTION_API,
        tipoEvento,
        idExterno,
        payload,
        status: INTEGRATION_EVENT_STATUS.RECEBIDO,
      })
      .returning()

    this.logger.log(
      `Evento de integração WhatsApp registrado com sucesso (ID: ${novoEvento.id}, tipo: ${tipoEvento}).`
    )

    return {
      received: true,
      duplicate: false,
      id: novoEvento.id,
    }
  }
}
