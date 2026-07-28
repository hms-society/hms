import { Inject, Injectable } from '@nestjs/common'
import type { IntakeCreation } from '@hms/core/intake/domain/entities'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'

@Injectable()
export class IntakeSeeder {
  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
  ) {}

  seed(intakes: IntakeCreation[] = []) {
    return this.intakesRepository.addMany(intakes)
  }

  clear() {
    return this.intakesRepository.removeAll()
  }

  run() {
    return this.seed()
  }
}
