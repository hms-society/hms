import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import {
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { acknowledgeSignatureDocumentSchema } from '@hms/validation/formalization'
import { AcknowledgeSignatureDocumentUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  FormalizationSignatureGatewayTransaction,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { OptionalSigningGatewayCollaboratorGuard } from '@/formalization/rest/guards/optional-signing-gateway-collaborator.guard'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import type { GatewayRequest } from '@/formalization/rest/controllers/signing-gateway.controller'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
class AcknowledgeDocumentBody extends createZodDto(acknowledgeSignatureDocumentSchema) {}
@SigningGatewayRoute()
export class AcknowledgeSigningDocumentController extends SigningGatewayController {
  private readonly useCase: AcknowledgeSignatureDocumentUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements)
    acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
  ) {
    super()
    this.useCase = new AcknowledgeSignatureDocumentUseCase({
      sessionsRepository,
      requestsRepository,
      documentsRepository,
      acknowledgementsRepository,
      assignmentsRepository,
      recipientsRepository,
      sourceReader,
      transaction,
      idProvider,
      datetimeProvider,
      hasher,
    })
  }
  @Post('documents/:requestDocumentId/acknowledgement')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handle(
    @Param('requestDocumentId') requestDocumentId: string,
    @Body(new ZodValidationPipe(acknowledgeSignatureDocumentSchema))
    body: AcknowledgeDocumentBody,
    @Req() request: GatewayRequest,
    @Headers('X-HMS-Signing-CSRF') csrfToken: string,
  ) {
    return this.useCase.execute({
      sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
      deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
      csrfToken: this.requireGatewayValue(csrfToken, 'csrf'),
      requestDocumentId,
      expectedRequestVersion: body.expectedRequestVersion,
      acknowledged: true,
      sourceIpHash: this.hashGatewayFingerprint(request.ip ?? ''),
      userAgentHash: this.hashGatewayFingerprint(request.get('user-agent') ?? ''),
      ...this.getGatewayActor(request),
    })
  }
}
