import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
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

    await this.authGuard.canActivate(context)
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
