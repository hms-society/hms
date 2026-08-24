import { Inject, Injectable } from '@nestjs/common'
import type { DynamicForm, DynamicFormCreation } from '@hms/core/shared/domain'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'

import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'

@Injectable()
export class DynamicFormsSeeder {
  constructor(
    @Inject(DYNAMIC_FORMS_REPOSITORIES.dynamicForms)
    private readonly dynamicFormsRepository: DynamicFormsRepository,
  ) {}

  clear() {
    return this.dynamicFormsRepository.removeAll()
  }

  run(forms: readonly DynamicFormCreation[]): Promise<DynamicForm[]> {
    return this.dynamicFormsRepository.addMany(forms)
  }
}
