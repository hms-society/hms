import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import type { IdentityRequest } from '@/identity/context'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@Injectable()
export class OptionalSigningGatewayCollaboratorGuard implements CanActivate {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly activeCollaboratorGuard: ActiveCollaboratorGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<IdentityRequest & { headers: { authorization?: string } }>()
    if (!request.headers.authorization) return true

    try {
      await this.authGuard.canActivate(context)
    } catch (error) {
      // The signing invitation is authorized by its gateway cookies. An expired HMS
      // session must not prevent the recipient from opening that public flow.
      if (error instanceof UnauthorizedException) return true
      throw error
    }
    try {
      await this.activeCollaboratorGuard.canActivate(context)
    } catch (error) {
      // A valid HMS session may coexist with a client OTP flow. In that case the
      // gateway remains cookie-authorized and no collaborator identity is bound.
      if (error instanceof ForbiddenException) return true
      throw error
    }
    return true
  }
}
