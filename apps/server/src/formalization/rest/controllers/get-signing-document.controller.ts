import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Get, Inject, Param, Req, UseGuards } from '@nestjs/common'
import { GetSignatureDocumentUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
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
export class GetSigningDocumentController extends SigningGatewayController {
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
  @Get('documents/:requestDocumentId')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handle(
    @Param('requestDocumentId') requestDocumentId: string,
    @Req() request: GatewayRequest,
  ) {
    return this.useCase.execute({
      sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
      deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
      requestDocumentId,
      ...this.getGatewayActor(request),
    })
  }
}
