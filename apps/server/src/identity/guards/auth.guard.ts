import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { AuthProvider, UsersRepository } from '@hms/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import type { IdentityRequest } from '@/identity/context'

@Injectable()
export class AuthGuard implements CanActivate {
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
      throw new UnauthorizedException('Authentication token is required')
    }

    const session = await this.authProvider.getSession(token)

    if (!session) {
      throw new UnauthorizedException('Authentication token is invalid')
    }

    const user = await this.usersRepository.findById(session.user.id)
    if (!user || user.status === 'disabled') {
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
}
