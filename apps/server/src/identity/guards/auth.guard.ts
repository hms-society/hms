import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { AuthProvider } from '@hms/core/identity/interfaces'

import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'

type AuthenticatedRequest = {
  headers: { authorization?: string }
  user?: unknown
  auth?: unknown
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_PROVIDERS.auth) private readonly authProvider: AuthProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractBearerToken(request.headers.authorization)

    if (!token) {
      throw new UnauthorizedException('Authentication token is required')
    }

    const session = await this.authProvider.getSession(token)

    if (!session) {
      throw new UnauthorizedException('Authentication token is invalid')
    }

    request.user = session.user
    request.auth = session

    return true
  }

  private extractBearerToken(authorization?: string): string | undefined {
    if (!authorization?.startsWith('Bearer ')) return undefined

    const token = authorization.slice('Bearer '.length).trim()
    return token || undefined
  }
}
