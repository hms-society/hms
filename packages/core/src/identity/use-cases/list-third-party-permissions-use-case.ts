import type { UseCase } from '#shared/interfaces/use-case'

import type { ThirdPartyPermissionGrant } from '../domain/entities'
import type { ThirdPartyPermissionsRepository } from '../interfaces'

export class ListThirdPartyPermissionsUseCase
  implements UseCase<{ thirdPartyId: string }, ThirdPartyPermissionGrant[]>
{
  constructor(private readonly permissionsRepository: ThirdPartyPermissionsRepository) {}

  execute({ thirdPartyId }: { thirdPartyId: string }) {
    return this.permissionsRepository.listByThirdPartyId(thirdPartyId)
  }
}
