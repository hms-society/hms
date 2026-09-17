import { Injectable } from '@nestjs/common'
import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type {
  DynamicFormDefinitionDraft,
  DynamicFormOperation,
} from '@hms/core/legal-catalog/domain/structures'
import type { DynamicFormOperationsRepository } from '@hms/core/legal-catalog/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq } from 'drizzle-orm'

import { dynamicFormOperationModel } from '@/legal-catalog/database/drizzle/models'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleDynamicFormOperationsRepository
  extends DrizzleRepository
  implements DynamicFormOperationsRepository
{
  async findByOperationKey(operationKey: string): Promise<DynamicFormOperation | null> {
    const [record] = await this.database
      .select()
      .from(dynamicFormOperationModel)
      .where(eq(dynamicFormOperationModel.operationKey, operationKey))

    return record ? this.toDomain(record) : null
  }

  async addOrGet(operation: DynamicFormOperation): Promise<DynamicFormOperation> {
    await this.database
      .insert(dynamicFormOperationModel)
      .values({
        operationKey: operation.operationKey,
        action: operation.action,
        actorCollaboratorId: operation.actorCollaboratorId,
        targetDynamicFormId: operation.targetDynamicFormId,
        expectedVersion: operation.expectedVersion,
        canonicalRequest: operation.canonicalRequest,
        result: operation.result,
        completedAt: operation.completedAt,
      })
      .onConflictDoNothing({ target: dynamicFormOperationModel.operationKey })

    const stored = await this.findByOperationKey(operation.operationKey)
    if (!stored) {
      throw new AppError('A operação do formulário não pôde ser persistida.')
    }
    return stored
  }

  private toDomain(
    record: typeof dynamicFormOperationModel.$inferSelect,
  ): DynamicFormOperation {
    return {
      operationKey: record.operationKey,
      action: record.action as DynamicFormOperation['action'],
      actorCollaboratorId: record.actorCollaboratorId,
      targetDynamicFormId: record.targetDynamicFormId,
      expectedVersion: record.expectedVersion,
      canonicalRequest: this.toCanonicalRequest(record.canonicalRequest),
      result: this.toDynamicForm(record.result),
      completedAt: record.completedAt,
    }
  }

  private toCanonicalRequest(
    request: DynamicFormOperation['canonicalRequest'],
  ): DynamicFormOperation['canonicalRequest'] {
    if (request.kind === 'duplicated') return request

    return {
      kind: request.kind,
      definition: this.toCanonicalDefinition(request.definition),
    }
  }

  private toCanonicalDefinition(
    definition: DynamicFormDefinitionDraft,
  ): DynamicFormDefinitionDraft {
    return {
      name: definition.name,
      ...(definition.description ? { description: definition.description } : {}),
      stage: definition.stage,
      legalAreaId: definition.legalAreaId,
      legalTopicIds: [...definition.legalTopicIds],
      fields: definition.fields.map((field) => this.toCanonicalField(field)),
    }
  }

  private toCanonicalField(
    field: DynamicFormDefinitionDraft['fields'][number],
  ): DynamicFormDefinitionDraft['fields'][number] {
    return {
      ...(field.fieldId ? { fieldId: field.fieldId } : {}),
      label: field.label,
      required: field.required,
      ...(field.description ? { description: field.description } : {}),
      type: field.type,
      ...('placeholder' in field && field.placeholder
        ? { placeholder: field.placeholder }
        : {}),
      ...('defaultValue' in field && field.defaultValue !== undefined
        ? { defaultValue: field.defaultValue }
        : {}),
      ...('options' in field
        ? {
            options: field.options.map((option) => ({
              ...(option.optionId ? { optionId: option.optionId } : {}),
              label: option.label,
            })),
          }
        : {}),
      ...('defaultOptionIndex' in field && field.defaultOptionIndex !== undefined
        ? { defaultOptionIndex: field.defaultOptionIndex }
        : {}),
      ...('defaultOptionIndexes' in field && field.defaultOptionIndexes !== undefined
        ? { defaultOptionIndexes: [...field.defaultOptionIndexes] }
        : {}),
      ...('currency' in field ? { currency: field.currency } : {}),
      ...(field.validation
        ? { validation: this.toCanonicalValidation(field.validation) }
        : {}),
    } as DynamicFormDefinitionDraft['fields'][number]
  }

  private toCanonicalValidation(
    validation: NonNullable<DynamicFormDefinitionDraft['fields'][number]['validation']>,
  ) {
    return {
      ...(validation.min !== undefined ? { min: validation.min } : {}),
      ...(validation.max !== undefined ? { max: validation.max } : {}),
      ...(validation.scale !== undefined ? { scale: validation.scale } : {}),
      ...(validation.requiredWhen
        ? {
            requiredWhen: {
              fieldKey: validation.requiredWhen.fieldKey,
              equals: validation.requiredWhen.equals,
            },
          }
        : {}),
    }
  }

  private toDynamicForm(result: DynamicForm): DynamicForm {
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      fields: result.fields.map((field) => ({
        ...field,
        options: field.options?.map((option) => ({ ...option })),
        validation: field.validation
          ? {
              ...field.validation,
              requiredWhen: field.validation.requiredWhen
                ? { ...field.validation.requiredWhen }
                : undefined,
            }
          : undefined,
      })),
    }
  }
}
