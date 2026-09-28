import type { UseCase } from '#shared/interfaces/use-case'

import type { ThirdParty } from '../domain/entities'
import { ThirdPartyNotFoundError } from '../domain/errors'
import type { ThirdPartiesRepository } from '../interfaces'

export type GetThirdPartyRequest = {
  readonly thirdPartyId: string
}

export class GetThirdPartyUseCase implements UseCase<GetThirdPartyRequest, ThirdParty> {
  constructor(private readonly thirdPartiesRepository: ThirdPartiesRepository) {}

  async execute({ thirdPartyId }: GetThirdPartyRequest): Promise<ThirdParty> {
    const thirdParty = await this.thirdPartiesRepository.findById(thirdPartyId)

    if (!thirdParty) throw new ThirdPartyNotFoundError()
    return thirdParty
  }
}
