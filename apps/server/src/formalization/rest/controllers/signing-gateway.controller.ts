import {
  BadRequestException,
  Body,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { createHash } from 'node:crypto'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import type { Request, Response } from 'express'
import {
  exchangeSignatureInvitationSchema,
  acknowledgeSignatureDocumentSchema,
  requestSignatureOtpSchema,
  startSigningSchema,
  verifySignatureOtpSchema,
} from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationSigningGatewayService } from '@/formalization/formalization-signature-sending.service'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { IdentityRequest } from '@/identity/context'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { OptionalSigningGatewayCollaboratorGuard } from '@/formalization/rest/guards/optional-signing-gateway-collaborator.guard'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { SIGNING_GATEWAY_CSRF_HEADER } from '@/shared/rest/signing-gateway-headers'

class ExchangeInvitationBody extends createZodDto(exchangeSignatureInvitationSchema) {}
class RequestOtpBody extends createZodDto(requestSignatureOtpSchema) {}
class VerifyOtpBody extends createZodDto(verifySignatureOtpSchema) {}
class StartSigningBody extends createZodDto(startSigningSchema) {}
class AcknowledgeDocumentBody extends createZodDto(acknowledgeSignatureDocumentSchema) {}

const FLOW_COOKIE = 'hms_signing_flow'
const DEVICE_COOKIE = 'hms_signing_device'
type GatewayRequest = Request & IdentityRequest

@SigningGatewayRoute()
export class SigningGatewayController {
  constructor(
    private readonly service: FormalizationSigningGatewayService,
    private readonly env: EnvProvider,
  ) {}

  @Post('invitations/exchange')
  @HttpCode(HttpStatus.OK)
  handleExchange(
    @Body(new ZodValidationPipe(exchangeSignatureInvitationSchema))
    body: ExchangeInvitationBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.service
      .exchange({
        token: body.token,
        origin: this.origin(request),
        sourceIpHash: this.fingerprint(request.ip ?? ''),
        userAgentHash: this.fingerprint(request.get('user-agent') ?? ''),
      })
      .then((session) => {
        this.setCookie(response, FLOW_COOKIE, session.flowToken, session.expiresAt)
        this.setCookie(response, DEVICE_COOKIE, session.deviceToken, session.expiresAt)
        response.setHeader(SIGNING_GATEWAY_CSRF_HEADER, session.csrfToken)
        return { step: 'invitation' as const, csrfToken: session.csrfToken }
      })
  }

  @Get('context')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handleContext(
    @Req() request: GatewayRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.service
      .context({
        sessionToken: this.sessionToken(request),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        ...this.actor(request),
      })
      .then((result) => {
        response.setHeader(
          SIGNING_GATEWAY_CSRF_HEADER,
          this.required(result.csrfToken, 'csrf'),
        )
        return result
      })
  }

  @Get('channels')
  handleChannels(@Req() request: Request) {
    return this.service.channels({
      flowToken: this.cookie(request, FLOW_COOKIE),
      deviceToken: this.cookie(request, DEVICE_COOKIE),
    })
  }

  @Post('otp')
  @HttpCode(HttpStatus.OK)
  handleRequestOtp(
    @Body(new ZodValidationPipe(requestSignatureOtpSchema)) body: RequestOtpBody,
    @Req() request: Request,
    @Headers(SIGNING_GATEWAY_CSRF_HEADER) csrfToken: string,
  ) {
    return this.service
      .requestOtp({
        flowToken: this.cookie(request, FLOW_COOKIE),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        csrfToken: this.required(csrfToken, 'csrf'),
        channelChoiceId: body.channelChoiceId,
        sourceIpHash: this.fingerprint(request.ip ?? ''),
      })
      .then((result) => ({
        challengeId: result.challengeId,
        expiresAt: result.expiresAt.toISOString(),
        resendAvailableAt: result.resendAvailableAt.toISOString(),
      }))
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  handleVerifyOtp(
    @Body(new ZodValidationPipe(verifySignatureOtpSchema)) body: VerifyOtpBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers(SIGNING_GATEWAY_CSRF_HEADER) csrfToken: string,
  ) {
    return this.service
      .verifyOtp({
        flowToken: this.cookie(request, FLOW_COOKIE),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        csrfToken: this.required(csrfToken, 'csrf'),
        challengeId: body.challengeId,
        code: body.code,
        sourceIpHash: this.fingerprint(request.ip ?? ''),
      })
      .then((session) => {
        this.setCookie(
          response,
          FLOW_COOKIE,
          session.authenticatedToken,
          session.expiresAt,
        )
        this.setCookie(response, DEVICE_COOKIE, session.deviceToken, session.expiresAt)
        return this.service
          .context({
            sessionToken: session.authenticatedToken,
            deviceToken: session.deviceToken,
          })
          .then((result) => {
            response.setHeader(
              SIGNING_GATEWAY_CSRF_HEADER,
              this.required(result.csrfToken, 'csrf'),
            )
            return result
          })
      })
  }

  @Post('collaborator/session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, ActiveCollaboratorGuard)
  handleCollaboratorSession(
    @Req() request: Request,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Res({ passthrough: true }) response: Response,
    @Headers(SIGNING_GATEWAY_CSRF_HEADER) csrfToken: string,
  ) {
    return this.service
      .establishCollaboratorSession({
        flowToken: this.cookie(request, FLOW_COOKIE),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        actorId: collaborator.collaboratorId,
        csrfToken: this.required(csrfToken, 'csrf'),
      })
      .then((session) => {
        this.setCookie(
          response,
          FLOW_COOKIE,
          session.authenticatedToken,
          session.expiresAt,
        )
        this.setCookie(response, DEVICE_COOKIE, session.deviceToken, session.expiresAt)
        return this.service
          .context({
            sessionToken: session.authenticatedToken,
            deviceToken: session.deviceToken,
            actorId: collaborator.collaboratorId,
          })
          .then((result) => {
            response.setHeader(
              SIGNING_GATEWAY_CSRF_HEADER,
              this.required(result.csrfToken, 'csrf'),
            )
            return result
          })
      })
  }

  @Get('documents/:requestDocumentId')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handleDocument(
    @Param('requestDocumentId') requestDocumentId: string,
    @Req() request: GatewayRequest,
  ) {
    return this.service.document({
      sessionToken: this.sessionToken(request),
      deviceToken: this.cookie(request, DEVICE_COOKIE),
      requestDocumentId,
      ...this.actor(request),
    })
  }

  @Get('documents')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handleDocuments(
    @Req() request: GatewayRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.service
      .context({
        sessionToken: this.sessionToken(request),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        ...this.actor(request),
      })
      .then((context) => {
        if (context.step !== 'reading') {
          throw new BadRequestException('Signing documents are unavailable.')
        }
        response.setHeader(
          SIGNING_GATEWAY_CSRF_HEADER,
          this.required(context.csrfToken, 'csrf'),
        )
        return {
          documents: context.documents,
          acknowledgedDocumentIds: context.acknowledgedDocumentIds,
          requestVersion: context.requestVersion,
        }
      })
  }

  @Get('documents/:requestDocumentId/content')
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  async handleDocumentContent(
    @Param('requestDocumentId') requestDocumentId: string,
    @Req() request: GatewayRequest,
    @Res() response: Response,
  ) {
    const result = await this.service.documentContent({
      sessionToken: this.sessionToken(request),
      deviceToken: this.cookie(request, DEVICE_COOKIE),
      requestDocumentId,
      ...this.actor(request),
    })
    response
      .setHeader('Cache-Control', 'private, no-store')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .setHeader('Accept-Ranges', 'none')
      .type('application/pdf')
      .send(Buffer.from(result.content))
  }

  @Post('documents/:requestDocumentId/acknowledgement')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handleAcknowledge(
    @Param('requestDocumentId') requestDocumentId: string,
    @Body(new ZodValidationPipe(acknowledgeSignatureDocumentSchema))
    body: AcknowledgeDocumentBody,
    @Req() request: GatewayRequest,
    @Headers(SIGNING_GATEWAY_CSRF_HEADER) csrfToken: string,
  ) {
    return this.service.acknowledge({
      sessionToken: this.sessionToken(request),
      deviceToken: this.cookie(request, DEVICE_COOKIE),
      csrfToken: this.required(csrfToken, 'csrf'),
      requestDocumentId,
      expectedRequestVersion: body.expectedRequestVersion,
      acknowledged: true,
      sourceIpHash: this.fingerprint(request.ip ?? ''),
      userAgentHash: this.fingerprint(request.get('user-agent') ?? ''),
      ...this.actor(request),
    })
  }

  @Post('signing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalSigningGatewayCollaboratorGuard)
  handleStart(
    @Body(new ZodValidationPipe(startSigningSchema)) body: StartSigningBody,
    @Req() request: GatewayRequest,
    @Headers(SIGNING_GATEWAY_CSRF_HEADER) csrfToken: string,
  ) {
    return this.service
      .start({
        sessionToken: this.sessionToken(request),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        csrfToken: this.required(csrfToken, 'csrf'),
        expectedRequestVersion: body.expectedRequestVersion,
        ...this.actor(request),
      })
      .then((result) => ({
        proxyPath: result.proxyPath,
        expiresAt: result.expiresAt.toISOString(),
      }))
  }

  @Get('result')
  handleResult(@Req() request: Request) {
    return this.service.result({
      sessionToken: this.sessionToken(request),
      deviceToken: this.cookie(request, DEVICE_COOKIE),
    })
  }

  @Delete('result')
  @HttpCode(HttpStatus.NO_CONTENT)
  handleCloseResult(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers(SIGNING_GATEWAY_CSRF_HEADER) csrfToken: string,
  ) {
    return this.service
      .closeResult({
        sessionToken: this.sessionToken(request),
        deviceToken: this.cookie(request, DEVICE_COOKIE),
        csrfToken: this.required(csrfToken, 'csrf'),
      })
      .then(() => {
        response.setHeader(
          'Set-Cookie',
          `${FLOW_COOKIE}=; Max-Age=0; Path=/formalizations/signing-gateway; HttpOnly; SameSite=Lax`,
        )
      })
  }

  private sessionToken(request: Request) {
    return this.cookie(request, FLOW_COOKIE)
  }

  private actor(request: GatewayRequest): { actorId: string } | Record<string, never> {
    return request.collaborator ? { actorId: request.collaborator.collaboratorId } : {}
  }

  private cookie(request: Request, name: string) {
    const value = (request.headers.cookie ?? '')
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1)
    return this.required(value ? decodeURIComponent(value) : undefined)
  }

  private required(value: string | undefined, kind: 'session' | 'csrf' = 'session') {
    if (!value) {
      throw new BadRequestException(
        kind === 'csrf'
          ? 'Signing Gateway CSRF token is required.'
          : 'Signing Gateway session is required.',
      )
    }
    return value
  }

  private setCookie(response: Response, name: string, value: string, expiresAt: Date) {
    const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    response.append(
      'Set-Cookie',
      `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/formalizations/signing-gateway; HttpOnly; SameSite=Lax`,
    )
  }

  private origin(request: Request) {
    const origin = request.get('origin')
    return origin || this.env.get('HMS_WEB_APP_URL')
  }

  private fingerprint(value: string) {
    return createHash('sha256').update(value).digest('hex')
  }
}
