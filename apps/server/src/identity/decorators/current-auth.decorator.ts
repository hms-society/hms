import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { AuthSession, AuthUser } from '@hms/core/identity/domain/structures'

import type { AuthenticatedIdentityRequest } from '@/identity/context'

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthSession => {
    const request = context.switchToHttp().getRequest<AuthenticatedIdentityRequest>()
    return request.auth
  },
)

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedIdentityRequest>()
    return request.user
  },
)
