import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import {
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { startSigningSchema } from '@hms/validation/formalization'
import { StartFormalizationSigningUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureGatewayTransaction,
  SignatureProvider,
  FormalizationSignatureSourceReader,
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
class StartSigningBody extends createZodDto(startSigningSchema) {}
@SigningGatewayRoute()
export class StartSigningController extends SigningGatewayController {
  private readonly useCase: StartFormalizationSigningUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements)
    acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderResources)
    providerResourcesRepository: FormalizationSignatureProviderResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderRecipientResources)
    providerRecipientResourcesRepository: FormalizationSignatureProviderRecipientResourcesRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(FORMALIZATION_PROVIDERS.signatureProvider) provider: SignatureProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
    },
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
  ) {
    super()
    this.useCase = new StartFormalizationSigningUseCase({
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      documentsRepository,
      assignmentsRepository,
      acknowledgementsRepository,
      bindingsRepository,
      providerResourcesRepository,
      providerRecipientResourcesRepository,
      transaction,
      provider,
      sourceReader,
      idProvider,
      datetimeProvider,
      secretGenerator,
      hasher,
    })
  }
  @Post('signing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handle(
    @Body(new ZodValidationPipe(startSigningSchema)) body: StartSigningBody,
    @Req() request: GatewayRequest,
    @Headers('X-HMS-Signing-CSRF') csrfToken: string,
  ) {
    return this.useCase
      .execute({
        sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
        deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
        csrfToken: this.requireGatewayValue(csrfToken, 'csrf'),
        expectedRequestVersion: body.expectedRequestVersion,
        ...this.getGatewayActor(request),
      })
      .then((result) => ({
        proxyPath: result.proxyPath,
        expiresAt: result.expiresAt.toISOString(),
      }))
  }
}
