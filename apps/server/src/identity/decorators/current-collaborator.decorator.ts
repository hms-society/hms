import {
  createParamDecorator,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import type { AuthorizedIdentityRequest } from '@/identity/context'

export const CurrentCollaborator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CollaboratorSummary => {
    const request = context.switchToHttp().getRequest<AuthorizedIdentityRequest>()

    if (!request.collaborator) {
      throw new ForbiddenException('An authorized collaborator is required')
    }

    return request.collaborator
  },
)
