import type { UseCase } from '#shared/interfaces/use-case'

import { InvalidThirdPartyDataError, ThirdPartyNotFoundError } from '../domain/errors'
import type { ThirdParty, ThirdPartyPermissionGrant } from '../domain/entities'
import { ThirdPartyPermission } from '../domain/structures'
import type {
  ThirdPartyAuditLogsRepository,
  ThirdPartiesRepository,
  ThirdPartyPermissionsRepository,
} from '../interfaces'

export type GrantThirdPartyPermissionRequest = {
  readonly actorId: string
  readonly actorProfile: 'admin' | 'supervisor'
  readonly thirdPartyId: string
  readonly permission: ThirdPartyPermission
}

export class GrantThirdPartyPermissionUseCase
  implements UseCase<GrantThirdPartyPermissionRequest, ThirdPartyPermissionGrant>
{
  constructor(
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
    private readonly permissionsRepository: ThirdPartyPermissionsRepository,
    private readonly auditLogsRepository?: ThirdPartyAuditLogsRepository,
  ) {}

  async execute(request: GrantThirdPartyPermissionRequest) {
    if (!['admin', 'supervisor'].includes(request.actorProfile)) {
      throw new InvalidThirdPartyDataError(
        'Somente administradores e supervisores podem conceder permissões.',
      )
    }

    if (!Object.values(ThirdPartyPermission).includes(request.permission)) {
      throw new InvalidThirdPartyDataError('Permissão de terceiro inválida.')
    }

    const thirdParty = await this.thirdPartiesRepository.findById(request.thirdPartyId)
    if (!thirdParty) throw new ThirdPartyNotFoundError()
    if (thirdParty.status !== 'active') {
      throw new InvalidThirdPartyDataError(
        'Terceiros inativos não podem receber permissões.',
      )
    }

    const grant = await this.permissionsRepository.grant(
      thirdParty.id,
      request.permission,
      request.actorId,
    )

    await this.auditLogsRepository?.create({
      actorId: request.actorId,
      actorProfile: request.actorProfile,
      action: 'permission_granted',
      permission: request.permission,
      thirdParty,
    })

    return grant
  }
}

export const THIRD_PARTY_PERMISSIONS = Object.values(ThirdPartyPermission)
