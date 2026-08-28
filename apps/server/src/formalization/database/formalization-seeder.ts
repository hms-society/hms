import { Inject, Injectable } from '@nestjs/common'
import type { Client, Collaborator } from '@hms/core/identity/domain/entities'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { Intake } from '@hms/core/intake/domain/entities'
import type {
  DynamicForm,
  DynamicFormAnswer,
  DynamicFormAnswerValue,
} from '@hms/core/shared/domain'
import { AppError } from '@hms/core/shared/domain/errors'
import type { FormalizationCreation } from '@hms/core/formalization/domain/entities'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'

const SEEDED_FORMALIZATION_ID = '00000000-0000-4000-8000-000000000701'
const SEEDED_CONFIRMATION_DATE = new Date('2026-08-20T15:15:00.000Z')

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
      contractFormAnswers: this.createConfirmedFormAnswers(references.contractForm),
      contractFormState: 'closed',
      contractFormRevision: 1,
      contractFormClosedAt: SEEDED_CONFIRMATION_DATE,
      contractFormClosedByCollaboratorId: references.assignedLawyer.id,
      documentsConfirmedAt: SEEDED_CONFIRMATION_DATE,
      documentsConfirmedByCollaboratorId: references.assignedLawyer.id,
      documentsConfirmedRevision: 1,
      version: 1,
    })
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...creation } = seeded
    return this.formalizationsRepository.addOrGet(creation as FormalizationCreation)
  }

  private createConfirmedFormAnswers(form: DynamicForm): DynamicFormAnswer[] {
    return form.fields.map((field) => ({
      fieldId: field.id,
      value: this.getConfirmedAnswerValue(field.key),
    }))
  }

  private getConfirmedAnswerValue(fieldKey: string): DynamicFormAnswerValue {
    const values: Record<string, DynamicFormAnswerValue> = {
      service_type: 'representation',
      payment_method: 'monthly',
      fixed_fee: 2500,
      success_fee: 10,
      installments: 12,
      start_date: '2026-09-01',
      has_exclusivity: false,
      commercial_notes: 'Configuração inicial confirmada para o atendimento.',
    }
    const value = values[fieldKey]
    if (value === undefined) {
      throw new AppError(
        `The Formalization form field ${fieldKey} has no seed value.`,
        'Seed Error',
      )
    }
    return value
  }
}
