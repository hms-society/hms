import type { UseCase } from '#shared/interfaces/use-case'

import { InvalidThirdPartyDataError, ThirdPartyNotFoundError } from '../domain/errors'
import type { ThirdPartyPermissionGrant } from '../domain/entities'
import { ThirdPartyPermission } from '../domain/structures'
import type {
  ThirdPartyAuditLogsRepository,
  ThirdPartiesRepository,
  ThirdPartyPermissionsRepository,
} from '../interfaces'

export type RevokeThirdPartyPermissionRequest = {
  readonly actorId: string
  readonly actorProfile: 'admin' | 'supervisor'
  readonly thirdPartyId: string
  readonly permission: ThirdPartyPermission
}

export class RevokeThirdPartyPermissionUseCase
  implements
    UseCase<RevokeThirdPartyPermissionRequest, ThirdPartyPermissionGrant | undefined>
{
  constructor(
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
    private readonly permissionsRepository: ThirdPartyPermissionsRepository,
    private readonly auditLogsRepository?: ThirdPartyAuditLogsRepository,
  ) {}

  async execute(request: RevokeThirdPartyPermissionRequest) {
    if (!['admin', 'supervisor'].includes(request.actorProfile)) {
      throw new InvalidThirdPartyDataError(
        'Somente administradores e supervisores podem revogar permissões.',
      )
    }

    if (!Object.values(ThirdPartyPermission).includes(request.permission)) {
      throw new InvalidThirdPartyDataError('Permissão de terceiro inválida.')
    }

    const thirdParty = await this.thirdPartiesRepository.findById(request.thirdPartyId)
    if (!thirdParty) throw new ThirdPartyNotFoundError()

    const revoked = await this.permissionsRepository.revoke(
      thirdParty.id,
      request.permission,
    )

    if (revoked) {
      await this.auditLogsRepository?.create({
        actorId: request.actorId,
        actorProfile: request.actorProfile,
        action: 'permission_revoked',
        permission: request.permission,
        thirdParty,
      })
    }

    return revoked
  }
}

export const THIRD_PARTY_PERMISSION_VALUES = Object.values(ThirdPartyPermission)
