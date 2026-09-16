import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { AppError } from '@hms/core/shared/domain/errors'
import type { DynamicForm, DynamicFormCreation } from '@hms/core/shared/domain'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'
import type { DynamicForm as CanonicalDynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormDefinitionField } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleDynamicFormAdministrationRepository } from '@/legal-catalog/database/drizzle/repositories'

@Injectable()
export class DrizzleDynamicFormsRepository
  extends DrizzleRepository
  implements DynamicFormsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleDynamicFormAdministrationRepository)
    private readonly administrationRepository: DynamicFormAdministrationRepository &
      Pick<DrizzleDynamicFormAdministrationRepository, 'addMany' | 'removeAll'>,
  ) {
    super(drizzle)
  }

  async list(): Promise<DynamicForm[]> {
    const forms: DynamicForm[] = []
    let page = 1
    let pageCount = 1

    while (page <= pageCount) {
      const result = await this.administrationRepository.list({ page, pageSize: 5 })
      pageCount = result.pageCount
      for (const item of result.items) {
        const form = await this.administrationRepository.findById(item.id)
        if (form && form.status === 'available') forms.push(this.toLegacy(form))
      }
      page += 1
    }

    return forms
  }

  async addMany(forms: readonly DynamicFormCreation[]): Promise<DynamicForm[]> {
    if (forms.length === 0) return []

    const now = new Date()
    const canonicalForms = forms.map((form) => this.toCanonical(form, now))
    await this.administrationRepository.addMany(canonicalForms)

    return canonicalForms.map((form) => this.toLegacy(form))
  }

  async removeAll() {
    await this.administrationRepository.removeAll()
  }

  private toCanonical(form: DynamicFormCreation, now: Date): CanonicalDynamicForm {
    const formalizationContext = form.contexts.find(
      ({ type }) => type === 'formalization',
    )
    const context = formalizationContext ?? form.contexts[0]
    const legalAreaId = context?.data.legalAreaId
    const legalTopicIds = context?.data.legalTopicIds

    if (typeof legalAreaId !== 'string' || !Array.isArray(legalTopicIds)) {
      throw new AppError('A dynamic form must have a legal area and legal topics.')
    }

    const normalizedName = form.name.trim().toLocaleLowerCase('pt-BR')
    return {
      id: randomUUID(),
      name: form.name.trim(),
      normalizedName,
      description: form.description ?? null,
      status: form.status,
      stage: formalizationContext ? 'formalization' : 'consultation',
      legalAreaId,
      legalTopicIds: legalTopicIds.filter(
        (legalTopicId): legalTopicId is string => typeof legalTopicId === 'string',
      ),
      fields: form.fields.map((field, position) =>
        this.toCanonicalField(field, position),
      ),
      version: 1,
      createdAt: now,
      updatedAt: now,
    }
  }

  private toCanonicalField(
    field: DynamicForm['fields'][number],
    position: number,
  ): DynamicFormDefinitionField {
    return {
      ...field,
      id: randomUUID(),
      position,
      options: field.options?.map((option, optionPosition) => ({
        ...option,
        id: randomUUID(),
        position: optionPosition,
      })),
    }
  }

  private toLegacy(form: CanonicalDynamicForm): DynamicForm {
    return {
      id: form.id,
      name: form.name,
      description: form.description ?? undefined,
      status: form.status,
      contexts: [
        {
          type: form.stage === 'formalization' ? 'formalization' : 'legal',
          data: {
            legalAreaId: form.legalAreaId,
            legalTopicIds: [...form.legalTopicIds],
          },
        },
      ],
      fields: [...form.fields],
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    }
  }
}
