import type { UseCase } from '#shared/interfaces/use-case'

import type { ThirdParty } from '../domain/entities'
import { InvalidThirdPartyDataError, ThirdPartyNotFoundError } from '../domain/errors'
import { ThirdPartyStatus } from '../domain/structures'
import type { ThirdPartyAuditLogsRepository } from '../interfaces/third-party-audit-logs-repository'
import type { ThirdPartiesRepository } from '../interfaces/third-parties-repository'

export type ReactivateThirdPartyRequest = {
  readonly actorId: string
  readonly actorProfile: 'admin' | 'supervisor'
  readonly thirdPartyId: string
}

export class ReactivateThirdPartyUseCase
  implements UseCase<ReactivateThirdPartyRequest, ThirdParty>
{
  constructor(
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
    private readonly auditLogsRepository?: ThirdPartyAuditLogsRepository,
  ) {}

  async execute(request: ReactivateThirdPartyRequest): Promise<ThirdParty> {
    if (!['admin', 'supervisor'].includes(request.actorProfile)) {
      throw new InvalidThirdPartyDataError(
        'Somente administradores e supervisores podem reativar terceiros.',
      )
    }

    const thirdParty = await this.thirdPartiesRepository.findById(request.thirdPartyId)
    if (!thirdParty) throw new ThirdPartyNotFoundError()

    const updated = await this.thirdPartiesRepository.updateStatus(
      thirdParty.id,
      ThirdPartyStatus.Active,
    )
    if (!updated) throw new ThirdPartyNotFoundError()

    await this.auditLogsRepository?.create({
      actorId: request.actorId,
      actorProfile: request.actorProfile,
      action: 'reactivated',
      thirdParty: updated,
    })

    return updated
  }
}
