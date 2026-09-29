import type { UseCase } from '#shared/interfaces/use-case'

import type { ThirdParty } from '../domain/entities'
import { InvalidThirdPartyDataError, ThirdPartyNotFoundError } from '../domain/errors'
import { ThirdPartyStatus } from '../domain/structures'
import type { ThirdPartyAuditLogsRepository } from '../interfaces/third-party-audit-logs-repository'
import type { ThirdPartiesRepository } from '../interfaces/third-parties-repository'
import type { ThirdPartyPermissionsRepository } from '../interfaces/third-party-permissions-repository'

export type DeactivateThirdPartyRequest = {
  readonly actorId: string
  readonly actorProfile: 'admin' | 'supervisor'
  readonly thirdPartyId: string
}

export class DeactivateThirdPartyUseCase
  implements UseCase<DeactivateThirdPartyRequest, ThirdParty>
{
  constructor(
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
    private readonly auditLogsRepository?: ThirdPartyAuditLogsRepository,
    private readonly permissionsRepository?: ThirdPartyPermissionsRepository,
  ) {}

  async execute(request: DeactivateThirdPartyRequest): Promise<ThirdParty> {
    if (!['admin', 'supervisor'].includes(request.actorProfile)) {
      throw new InvalidThirdPartyDataError(
        'Somente administradores e supervisores podem inativar terceiros.',
      )
    }

    const thirdParty = await this.thirdPartiesRepository.findById(request.thirdPartyId)
    if (!thirdParty) throw new ThirdPartyNotFoundError()

    const updated = await this.thirdPartiesRepository.updateStatus(
      thirdParty.id,
      ThirdPartyStatus.Inactive,
    )
    if (!updated) throw new ThirdPartyNotFoundError()

    await this.permissionsRepository?.revokeAll(thirdParty.id)

    await this.auditLogsRepository?.create({
      actorId: request.actorId,
      actorProfile: request.actorProfile,
      action: 'deactivated',
      thirdParty: updated,
    })

    return updated
  }
}
