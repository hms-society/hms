import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import {
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import {
  EstablishCollaboratorSigningSessionUseCase,
  GetSignatureGatewayContextUseCase,
} from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureProxyBindingsRepository,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
@SigningGatewayRoute()
export class EstablishCollaboratorSigningSessionController extends SigningGatewayController {
  private readonly useCase: EstablishCollaboratorSigningSessionUseCase
  private readonly contextUseCase: GetSignatureGatewayContextUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements)
    acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
    },
  ) {
    super()
    this.useCase = new EstablishCollaboratorSigningSessionUseCase({
      sessionsRepository,
      invitationsRepository,
      recipientsRepository,
      requestsRepository,
      assignmentsRepository,
      sourceReader,
      transaction,
      idProvider,
      datetimeProvider,
      hasher,
    })
    this.contextUseCase = new GetSignatureGatewayContextUseCase({
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
  @Post('collaborator/session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, ActiveCollaboratorGuard)
  handle(
    @Req() request: Request,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Res({ passthrough: true }) response: Response,
    @Headers('X-HMS-Signing-CSRF') csrfToken: string,
  ) {
    return this.useCase
      .execute({
        flowToken: this.getGatewayCookie(request, FLOW_COOKIE),
        deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
        actorId: collaborator.collaboratorId,
        csrfToken: this.requireGatewayValue(csrfToken, 'csrf'),
      })
      .then((session) => {
        this.setGatewayCookie(
          response,
          FLOW_COOKIE,
          session.authenticatedToken,
          session.expiresAt,
        )
        this.setGatewayCookie(
          response,
          DEVICE_COOKIE,
          session.deviceToken,
          session.expiresAt,
        )
        return this.contextUseCase
          .execute({
            sessionToken: session.authenticatedToken,
            deviceToken: session.deviceToken,
            actorId: collaborator.collaboratorId,
          })
          .then((result) => {
            response.setHeader(
              'X-HMS-Signing-CSRF',
              this.requireGatewayValue(result.csrfToken, 'csrf'),
            )
            return result
          })
      })
  }
}
