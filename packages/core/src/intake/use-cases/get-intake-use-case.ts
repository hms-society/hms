import { IntakeNotFoundError } from '../domain/errors'
import type { Intake } from '../domain/entities'
import type { IntakesRepository } from '../interfaces/intakes-repository'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  intakeId: string
}

export class GetIntakeUseCase implements UseCase<Request, Intake> {
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute({ intakeId }: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(intakeId)

    if (!intake) {
      throw new IntakeNotFoundError()
    }

    return intake
  }
}
