import { Inject, Injectable } from '@nestjs/common'
import type { Client, Collaborator } from '@hms/core/identity/domain/entities'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { DynamicForm } from '@hms/core/shared/domain'
import type { FormalizationCreation } from '@hms/core/formalization/domain/entities'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'

const SEEDED_FORMALIZATION_ID = '00000000-0000-4000-8000-000000000701'

export type FormalizationSeedReferences = {
  readonly intake: Intake
  readonly consultation: Consultation
  readonly client: Client
  readonly assignedLawyer: Collaborator
  readonly contractForm: DynamicForm
}

@Injectable()
export class FormalizationSeeder {
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: FormalizationsRepository,
  ) {}

  clear() {
    return this.formalizationsRepository.removeAll()
  }

  async run(references: FormalizationSeedReferences) {
    const seeded = fakeFormalization({
      id: SEEDED_FORMALIZATION_ID,
      intakeId: references.intake.id,
      clientId: references.client.id,
      consultationId: references.consultation.id,
      assignedLawyerId: references.assignedLawyer.id,
      legalAreaId: references.intake.legalAreaId,
      legalTopicId: references.intake.legalTopicId,
      contractFormId: references.contractForm.id,
      contractFormSnapshot: {
        dynamicFormId: references.contractForm.id,
        name: references.contractForm.name,
        description: references.contractForm.description,
        fields: references.contractForm.fields,
      },
      contractFormAnswers: [],
      contractFormState: 'open',
      contractFormRevision: 0,
      version: 1,
    })
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...creation } = seeded
    return this.formalizationsRepository.addOrGet(creation as FormalizationCreation)
  }
}
