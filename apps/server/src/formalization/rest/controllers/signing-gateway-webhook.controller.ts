import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'
import { documensoWebhookSchema } from '@hms/validation/formalization'
import { ReceiveSignatureProviderWebhookUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureWebhookReceiptsRepository,
  SensitivePayloadCipherProvider,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import {
  DocumensoWebhookNormalizer,
  UnprocessableDocumensoWebhookError,
} from '@/formalization/provision'

@Controller('formalizations/signing-gateway/webhooks/documenso')
export class SigningGatewayWebhookController {
  private readonly receiveWebhookUseCase: ReceiveSignatureProviderWebhookUseCase

  constructor(
    private readonly env: EnvProvider,
    private readonly normalizer: DocumensoWebhookNormalizer,
    @Inject(FORMALIZATION_REPOSITORIES.signatureWebhookReceipts)
    webhookReceiptsRepository: FormalizationSignatureWebhookReceiptsRepository,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    private readonly cipher: SensitivePayloadCipherProvider,
  ) {
    this.receiveWebhookUseCase = new ReceiveSignatureProviderWebhookUseCase({
      receiptsRepository: webhookReceiptsRepository,
      idProvider,
      datetimeProvider,
    })
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Req() request: Request,
    @Headers('X-Documenso-Secret') secret: string | undefined,
    @Headers('X-Documenso-Event-Id') providerEventId: string | undefined,
    @Headers('X-Documenso-Event') eventType: string | undefined,
  ) {
    const configured = this.env.get('DOCUMENSO_WEBHOOK_SECRET')
    if (!configured || !secret || !this.safeEqual(configured, secret)) {
      throw new UnauthorizedException('Invalid provider webhook secret.')
    }
    const parsed = documensoWebhookSchema.safeParse(request.body)
    if (!parsed.success || !eventType || !providerEventId) {
      throw new BadRequestException('Invalid Documenso webhook.')
    }
    if (providerEventId !== parsed.data.id) {
      throw new BadRequestException('Invalid Documenso webhook event id.')
    }
    try {
      const normalized = await this.normalizer.normalize({
        eventName: eventType,
        webhook: parsed.data,
        receivedAt: new Date(),
      })
      const encrypted = await this.cipher.encrypt({
        plaintext: normalized.hint,
        purpose: 'webhook',
        contextId: normalized.dedupeKey,
      })
      await this.receiveWebhookUseCase.execute({
        dedupeKey: normalized.dedupeKey,
        hintKind: normalized.hintKind,
        encryptedHint: encrypted.ciphertext,
        cipherKeyId: encrypted.keyId,
        receivedAt: normalized.receivedAt,
      })
    } catch (error) {
      if (!(error instanceof UnprocessableDocumensoWebhookError)) throw error
    }
    return { accepted: true }
  }

  private safeEqual(expected: string, actual: string) {
    const expectedBytes = Buffer.from(expected)
    const actualBytes = Buffer.from(actual)
    return (
      expectedBytes.length === actualBytes.length &&
      timingSafeEqual(expectedBytes, actualBytes)
    )
  }
}
