import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { BadRequestException, Get, Inject, Res, Req, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { GetSignatureGatewayContextUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider } from '@hms/core/shared/interfaces'
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
export class ListSigningDocumentsController extends SigningGatewayController {
  private readonly useCase: GetSignatureGatewayContextUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements)
    acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
    },
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    super()
    this.useCase = new GetSignatureGatewayContextUseCase({
      sessionsRepository,
      recipientsRepository,
      documentsRepository,
      requestsRepository,
      protocolsRepository,
      assignmentsRepository,
      acknowledgementsRepository,
      bindingsRepository,
      sourceReader,
      hasher,
      secretGenerator,
      datetimeProvider,
    })
  }
  @Get('documents')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handle(@Req() request: GatewayRequest, @Res({ passthrough: true }) response: Response) {
    return this.useCase
      .execute({
        sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
        deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
        ...this.getGatewayActor(request),
      })
      .then((context) => {
        if (context.step !== 'reading')
          throw new BadRequestException('Signing documents are unavailable.')
        response.setHeader(
          'X-HMS-Signing-CSRF',
          this.requireGatewayValue(context.csrfToken, 'csrf'),
        )
        return {
          documents: context.documents,
          acknowledgedDocumentIds: context.acknowledgedDocumentIds,
          requestVersion: context.requestVersion,
        }
      })
  }
}
