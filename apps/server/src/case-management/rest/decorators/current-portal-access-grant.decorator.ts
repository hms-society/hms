import {
  createParamDecorator,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common'
import type { CasePortalAccessGrant } from '@hms/core/case-management/domain/entities'

export const CurrentPortalAccessGrant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CasePortalAccessGrant => {
    const request = context
      .switchToHttp()
      .getRequest<{ portalAccessGrant?: CasePortalAccessGrant }>()

    if (!request.portalAccessGrant) {
      throw new ForbiddenException('A valid portal access link is required')
    }

    return request.portalAccessGrant
  },
)
