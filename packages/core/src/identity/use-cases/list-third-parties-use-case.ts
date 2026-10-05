import type { UseCase } from '#shared/interfaces/use-case'

import type { ThirdParty } from '../domain/entities'
import type { ThirdPartiesRepository } from '../interfaces'

export class ListThirdPartiesUseCase implements UseCase<void, ThirdParty[]> {
  constructor(private readonly thirdPartiesRepository: ThirdPartiesRepository) {}

  execute(): Promise<ThirdParty[]> {
    return this.thirdPartiesRepository.findAll()
  }
}
