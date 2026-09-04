import { createHash } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import type {
  EmailProvider,
  SendEmailMessageParams,
  SendEmailMessageResult,
} from '@hms/core/communication/interfaces'
import { Resend } from 'resend'

import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly env: EnvProvider) {}

  async sendMessage(params: SendEmailMessageParams): Promise<SendEmailMessageResult> {
    if (params.fileIds.length > 0) {
      throw new AppError(
        'A entrega de e-mail de assinatura não aceita anexos.',
        'Anexos não suportados',
      )
    }

    const from = this.senderAddress()
    if (this.env.get('HMS_SERVER_APP_MODE') === 'dev') {
      return this.sendToMailpit(params, from)
    }

    const apiKey = this.env.get('RESEND_API_KEY')
    if (!apiKey) {
      throw new AppError(
        'RESEND_API_KEY é obrigatória fora do desenvolvimento local.',
        'Erro de Configuração de E-mail',
      )
    }

    const result = await new Resend(apiKey).emails.send(
      {
        from,
        to: params.to,
        subject: params.subject,
        text: params.text ?? '',
        ...(params.html ? { html: params.html } : {}),
        headers: this.headers(params),
      },
      { idempotencyKey: params.idempotencyKey },
    )
    if (result.error || !result.data?.id) {
      throw new AppError(
        result.error?.message ?? 'O Resend não retornou o identificador da mensagem.',
        'Erro no Envio de E-mail',
      )
    }

    return { externalMessageId: result.data.id }
  }

  private async sendToMailpit(
    params: SendEmailMessageParams,
    from: string,
  ): Promise<SendEmailMessageResult> {
    const response = await fetch(
      `${this.env.get('MAILPIT_API_URL').replace(/\/$/, '')}/api/v1/send`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          From: { Email: from },
          To: [{ Email: params.to }],
          Subject: params.subject,
          Text: params.text ?? '',
          HTML: params.html ?? '',
          Headers: this.headers(params),
        }),
      },
    )
    if (!response.ok) {
      throw new AppError(
        `O Mailpit rejeitou a mensagem com HTTP ${response.status}.`,
        'Erro no Envio de E-mail',
      )
    }

    const body = (await response.json().catch(() => ({}))) as {
      ID?: unknown
      id?: unknown
    }
    const externalMessageId =
      typeof body.ID === 'string'
        ? body.ID
        : typeof body.id === 'string'
          ? body.id
          : `mailpit:${createHash('sha256').update(params.idempotencyKey).digest('hex')}`
    return { externalMessageId }
  }

  private senderAddress() {
    const configured = this.env.get('HMS_SIGNING_EMAIL_FROM').trim()
    if (configured) return configured
    if (this.env.get('HMS_SERVER_APP_MODE') === 'dev') return 'signatures@hms.local'
    throw new AppError(
      'HMS_SIGNING_EMAIL_FROM é obrigatória fora do desenvolvimento local.',
      'Erro de Configuração de E-mail',
    )
  }

  private headers(params: SendEmailMessageParams) {
    return {
      ...(params.inReplyTo ? { 'In-Reply-To': params.inReplyTo } : {}),
      ...(params.references.length > 0
        ? { References: params.references.join(' ') }
        : {}),
    }
  }
}
