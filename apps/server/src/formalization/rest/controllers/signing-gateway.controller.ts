import { BadRequestException } from '@nestjs/common'
import { createHash } from 'node:crypto'
import type { Request, Response } from 'express'

import type { IdentityRequest } from '@/identity/context'
import { EnvProvider } from '@/shared/provision/env/env-provider'

export const FLOW_COOKIE = 'hms_signing_flow'
export const DEVICE_COOKIE = 'hms_signing_device'

export type GatewayRequest = Request & IdentityRequest

export abstract class SigningGatewayController {
  protected getGatewayCookie(request: Request, name: string) {
    const value = (request.headers.cookie ?? '')
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1)

    return this.requireGatewayValue(value ? decodeURIComponent(value) : undefined)
  }

  protected requireGatewayValue(
    value: string | undefined,
    kind: 'session' | 'csrf' = 'session',
  ) {
    if (!value) {
      throw new BadRequestException(
        kind === 'csrf'
          ? 'Signing Gateway CSRF token is required.'
          : 'Signing Gateway session is required.',
      )
    }

    return value
  }

  protected getGatewayActor(request: GatewayRequest) {
    return request.collaborator ? { actorId: request.collaborator.collaboratorId } : {}
  }

  protected hashGatewayFingerprint(value: string) {
    return createHash('sha256').update(value).digest('hex')
  }

  protected getGatewayOrigin(request: Request, env: EnvProvider) {
    return request.get('origin') || env.get('HMS_WEB_APP_URL')
  }

  protected setGatewayCookie(
    response: Response,
    name: string,
    value: string,
    expiresAt: Date,
  ) {
    const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    response.append(
      'Set-Cookie',
      `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/formalizations/signing-gateway; HttpOnly; SameSite=Lax`,
    )
  }
}
