import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import type { IntakesRepository } from '../interfaces'

type Request = {
  clientId: string
}

export class ListClientIntakesUseCase implements UseCase<Request, Intake[]> {
  constructor(private readonly intakesRepository: IntakesRepository) {}

  execute({ clientId }: Request): Promise<Intake[]> {
    return this.intakesRepository.findByClientId(clientId)
  }
}
