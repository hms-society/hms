import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Get, Inject, Param, Req, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
  FormalizationSignatureDocumentContentReader,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider } from '@hms/core/shared/interfaces'
import { GetSignatureDocumentUseCase } from '@hms/core/formalization/use-cases'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { OptionalSigningGatewayCollaboratorGuard } from '@/formalization/rest/guards/optional-signing-gateway-collaborator.guard'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import type { GatewayRequest } from '@/formalization/rest/controllers/signing-gateway.controller'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
@SigningGatewayRoute()
export class GetSigningDocumentContentController extends SigningGatewayController {
  private readonly useCase: GetSignatureDocumentUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureDocumentContentReader)
    private readonly contentReader: FormalizationSignatureDocumentContentReader,
  ) {
    super()
    this.useCase = new GetSignatureDocumentUseCase({
      sessionsRepository,
      documentsRepository,
      requestsRepository,
      recipientsRepository,
      assignmentsRepository,
      sourceReader,
      hasher,
      datetimeProvider,
    })
  }
  @Get('documents/:requestDocumentId/content')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  async handle(
    @Param('requestDocumentId') requestDocumentId: string,
    @Req() request: GatewayRequest,
    @Res() response: Response,
  ) {
    const document = await this.useCase.execute({
      sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
      deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
      requestDocumentId,
      ...this.getGatewayActor(request),
    })
    const content = await this.contentReader.readContent(document.privateFileId)
    if (!content) throw new Error('The signing document is unavailable.')
    response
      .setHeader('Cache-Control', 'private, no-store')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .setHeader('Accept-Ranges', 'none')
      .type('application/pdf')
      .send(Buffer.from(content))
  }
}
