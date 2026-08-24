import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import type { AuthProvider, UsersRepository } from '@hms/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import type { IdentityRequest } from '@/identity/context'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    @Inject(IDENTITY_PROVIDERS.auth) private readonly authProvider: AuthProvider,
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      IdentityRequest & {
        headers: { authorization?: string }
      }
    >()
    const token = this.extractBearerToken(request.headers.authorization)

    if (!token) {
      this.logger.warn(
        JSON.stringify({
          event: 'auth_guard_rejected',
          reason: 'missing_bearer_token',
          authorizationHeaderPresent: Boolean(request.headers.authorization),
        }),
      )
      throw new UnauthorizedException('Authentication token is required')
    }

    let session: Awaited<ReturnType<AuthProvider['getSession']>>
    try {
      session = await this.authProvider.getSession(token)
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'auth_guard_error',
          reason: 'auth_provider_failed',
          token: this.getTokenDiagnostics(token),
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      )
      throw error
    }

    if (!session) {
      this.logger.warn(
        JSON.stringify({
          event: 'auth_guard_rejected',
          reason: 'invalid_auth_session',
          token: this.getTokenDiagnostics(token),
        }),
      )
      throw new UnauthorizedException('Authentication token is invalid')
    }

    const user = await this.usersRepository.findById(session.user.id)
    if (!user || user.status === 'disabled') {
      this.logger.warn(
        JSON.stringify({
          event: 'auth_guard_rejected',
          reason: !user ? 'local_user_not_found' : 'local_user_disabled',
          authUserId: session.user.id,
          localUserStatus: user?.status ?? null,
          token: this.getTokenDiagnostics(token),
        }),
      )
      throw new UnauthorizedException('Authentication token is invalid')
    }

    request.user = session.user
    request.auth = session
    request.identity = {
      auth: session,
      user: session.user,
    }

    return true
  }

  private extractBearerToken(authorization?: string): string | undefined {
    if (!authorization?.startsWith('Bearer ')) return undefined

    const token = authorization.slice('Bearer '.length).trim()
    return token || undefined
  }

  private getTokenDiagnostics(token: string) {
    const parts = token.split('.')
    const payload = parts[1]

    let issuer: string | undefined
    if (payload) {
      try {
        const decodedPayload = JSON.parse(
          Buffer.from(payload, 'base64url').toString('utf8'),
        ) as { iss?: unknown }

        if (typeof decodedPayload.iss === 'string') issuer = decodedPayload.iss
      } catch {
        issuer = undefined
      }
    }

    return {
      length: token.length,
      jwtSegments: parts.length,
      issuer,
    }
  }
}
