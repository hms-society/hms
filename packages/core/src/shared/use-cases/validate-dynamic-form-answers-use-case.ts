import type {
  DynamicFormAnswer,
  DynamicFormAnswerValidationMode,
  DynamicFormField,
  DynamicFormFieldType,
  DynamicFormSnapshot,
  DynamicFormValidationIssue,
  DynamicFormValidationResult,
} from '../domain'
import { DynamicFormAnswerValidationMode as AnswerValidationMode } from '../domain'
import { InvalidDynamicFormDefinitionError } from '../domain/errors'
import type { UseCase } from '../interfaces/use-case'

type Request = {
  readonly snapshot: DynamicFormSnapshot
  readonly answers: readonly DynamicFormAnswer[]
  readonly mode: DynamicFormAnswerValidationMode
}

export class ValidateDynamicFormAnswersUseCase
  implements UseCase<Request, DynamicFormValidationResult>
{
  async execute({
    snapshot,
    answers,
    mode,
  }: Request): Promise<DynamicFormValidationResult> {
    this.validateDefinition(snapshot)

    const issues: DynamicFormValidationIssue[] = []
    const fieldsById = new Map(snapshot.fields.map((field) => [field.id, field]))
    const fieldsByKey = new Map(snapshot.fields.map((field) => [field.key, field]))
    const answersByFieldId = new Map<string, DynamicFormAnswer>()
    const normalizedAnswers: DynamicFormAnswer[] = []

    for (const answer of answers) {
      const field = fieldsById.get(answer.fieldId)
      if (!field) {
        issues.push({
          path: `field:${answer.fieldId}`,
          message: 'O campo informado não pertence à definição do formulário.',
        })
        continue
      }
      if (answersByFieldId.has(answer.fieldId)) {
        issues.push({
          path: `field:${answer.fieldId}`,
          message: 'O campo foi informado mais de uma vez.',
        })
        continue
      }

      const normalizedValue = this.normalizeValue(field, answer.value)
      const fieldIssues = this.validateValue(field, normalizedValue)
      issues.push(...fieldIssues)
      const normalizedAnswer = { fieldId: answer.fieldId, value: normalizedValue }
      answersByFieldId.set(answer.fieldId, normalizedAnswer)
      normalizedAnswers.push(normalizedAnswer)
    }

    if (mode === AnswerValidationMode.Complete) {
      for (const field of snapshot.fields) {
        const answer = answersByFieldId.get(field.id)
        const isConditionallyRequired = this.isConditionallyRequired(
          field,
          answersByFieldId,
          fieldsByKey,
        )
        if (
          (field.required || isConditionallyRequired) &&
          (!answer || this.isEmptyValue(answer.value))
        ) {
          issues.push({
            path: `field:${field.id}`,
            message: 'Este campo é obrigatório.',
          })
        }
      }
    }

    return { answers: normalizedAnswers, issues }
  }

  private validateDefinition(snapshot: DynamicFormSnapshot): void {
    if (!snapshot.dynamicFormId || !snapshot.name.trim()) {
      throw new InvalidDynamicFormDefinitionError(
        'A definição precisa de identificador e nome.',
      )
    }

    const fieldIds = new Set<string>()
    const fieldKeys = new Set<string>()
    const positions = new Set<number>()

    for (const field of snapshot.fields) {
      if (!field.id || fieldIds.has(field.id)) {
        throw new InvalidDynamicFormDefinitionError(
          'Os identificadores dos campos devem ser únicos.',
        )
      }
      if (!field.key.trim() || fieldKeys.has(field.key)) {
        throw new InvalidDynamicFormDefinitionError(
          'As chaves dos campos devem ser únicas.',
        )
      }
      if (
        !Number.isInteger(field.position) ||
        field.position < 0 ||
        positions.has(field.position)
      ) {
        throw new InvalidDynamicFormDefinitionError(
          'As posições dos campos devem ser inteiras e únicas.',
        )
      }
      fieldIds.add(field.id)
      fieldKeys.add(field.key)
      positions.add(field.position)

      const isSelection =
        field.type === 'multiple_selection' || field.type === 'single_selection'
      if (isSelection && (!field.options || field.options.length === 0)) {
        throw new InvalidDynamicFormDefinitionError(
          `O campo ${field.key} precisa de opções de seleção.`,
        )
      }
      if (!isSelection && field.options && field.options.length > 0) {
        throw new InvalidDynamicFormDefinitionError(
          `O campo ${field.key} não pode declarar opções de seleção.`,
        )
      }
      if (field.options) {
        const optionValues = new Set<string>()
        const optionPositions = new Set<number>()
        for (const option of field.options) {
          if (!option.value.trim() || optionValues.has(option.value)) {
            throw new InvalidDynamicFormDefinitionError(
              `As opções do campo ${field.key} devem ter valores únicos.`,
            )
          }
          if (
            optionPositions.has(option.position) ||
            !Number.isInteger(option.position)
          ) {
            throw new InvalidDynamicFormDefinitionError(
              `As posições das opções do campo ${field.key} devem ser únicas.`,
            )
          }
          optionValues.add(option.value)
          optionPositions.add(option.position)
        }
      }
      this.validateFieldValidation(field, fieldKeys)
    }

    for (const field of snapshot.fields) {
      const requiredWhen = field.validation?.requiredWhen
      if (requiredWhen && !fieldKeys.has(requiredWhen.fieldKey)) {
        throw new InvalidDynamicFormDefinitionError(
          `A regra condicional do campo ${field.key} referencia uma chave inexistente.`,
        )
      }
      if (requiredWhen?.fieldKey === field.key) {
        throw new InvalidDynamicFormDefinitionError(
          `A regra condicional do campo ${field.key} não pode referenciar a si mesma.`,
        )
      }
    }
  }

  private validateFieldValidation(field: DynamicFormField, fieldKeys: Set<string>): void {
    const validation = field.validation
    if (!validation) return
    const isNumeric =
      field.type === 'integer' || field.type === 'currency' || field.type === 'percentage'
    if (
      !isNumeric &&
      (validation.min !== undefined ||
        validation.max !== undefined ||
        validation.scale !== undefined)
    ) {
      throw new InvalidDynamicFormDefinitionError(
        `As regras numéricas do campo ${field.key} são incompatíveis com seu tipo.`,
      )
    }
    if (validation.min !== undefined && !Number.isFinite(validation.min)) {
      throw new InvalidDynamicFormDefinitionError(
        `O mínimo do campo ${field.key} é inválido.`,
      )
    }
    if (validation.max !== undefined && !Number.isFinite(validation.max)) {
      throw new InvalidDynamicFormDefinitionError(
        `O máximo do campo ${field.key} é inválido.`,
      )
    }
    if (
      validation.min !== undefined &&
      validation.max !== undefined &&
      validation.min > validation.max
    ) {
      throw new InvalidDynamicFormDefinitionError(
        `O mínimo do campo ${field.key} não pode ser maior que o máximo.`,
      )
    }
    if (
      validation.scale !== undefined &&
      (!Number.isInteger(validation.scale) || validation.scale < 0)
    ) {
      throw new InvalidDynamicFormDefinitionError(
        `A escala do campo ${field.key} é inválida.`,
      )
    }
    if (validation.requiredWhen && !fieldKeys.has(validation.requiredWhen.fieldKey))
      return
  }

  private normalizeValue(field: DynamicFormField, value: DynamicFormAnswer['value']) {
    if (value === null) return null
    if (
      field.type === 'short_text' ||
      field.type === 'long_text' ||
      field.type === 'date' ||
      field.type === 'single_selection'
    ) {
      return typeof value === 'string' ? value.trim() : value
    }
    if (field.type === 'multiple_selection') {
      return Array.isArray(value) ? [...new Set(value)] : value
    }
    return value
  }

  private validateValue(
    field: DynamicFormField,
    value: DynamicFormAnswer['value'],
  ): readonly DynamicFormValidationIssue[] {
    if (value === null) return []
    const path = `field:${field.id}`
    const issue = (message: string): DynamicFormValidationIssue[] => [{ path, message }]

    if (field.type === 'short_text' || field.type === 'long_text') {
      return typeof value === 'string' ? [] : issue('Informe um texto válido.')
    }
    if (field.type === 'date') {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return issue('Informe uma data no formato AAAA-MM-DD.')
      }
      const date = new Date(`${value}T00:00:00.000Z`)
      return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
        ? issue('Informe uma data válida.')
        : []
    }
    if (field.type === 'boolean') {
      return typeof value === 'boolean' ? [] : issue('Informe verdadeiro ou falso.')
    }
    if (field.type === 'multiple_selection') {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
        return issue('Informe uma lista de opções válida.')
      }
      return value.every((item) => field.options?.some((option) => option.value === item))
        ? []
        : issue('Uma ou mais opções não pertencem ao campo.')
    }
    if (field.type === 'single_selection') {
      return typeof value === 'string' &&
        field.options?.some((option) => option.value === value)
        ? []
        : issue('Informe uma opção válida.')
    }
    if (
      field.type === 'integer' ||
      field.type === 'currency' ||
      field.type === 'percentage'
    ) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return issue('Informe um número válido.')
      }
      if (field.type === 'integer' && !Number.isInteger(value)) {
        return issue('Informe um número inteiro.')
      }
      const min = field.validation?.min ?? (field.type === 'percentage' ? 0 : undefined)
      const max = field.validation?.max ?? (field.type === 'percentage' ? 100 : undefined)
      if (min !== undefined && value < min)
        return issue(`Informe um valor maior ou igual a ${min}.`)
      if (max !== undefined && value > max)
        return issue(`Informe um valor menor ou igual a ${max}.`)
      const scale = field.validation?.scale
      if (scale !== undefined && this.decimalPlaces(value) > scale) {
        return issue(`Informe no máximo ${scale} casas decimais.`)
      }
      return []
    }
    return issue(`O tipo ${field.type satisfies DynamicFormFieldType} não é suportado.`)
  }

  private isConditionallyRequired(
    field: DynamicFormField,
    answersByFieldId: ReadonlyMap<string, DynamicFormAnswer>,
    fieldsByKey: ReadonlyMap<string, DynamicFormField>,
  ): boolean {
    const requiredWhen = field.validation?.requiredWhen
    if (!requiredWhen) return false
    const dependency = fieldsByKey.get(requiredWhen.fieldKey)
    if (!dependency) return false
    return answersByFieldId.get(dependency.id)?.value === requiredWhen.equals
  }

  private isEmptyValue(value: DynamicFormAnswer['value']): boolean {
    return value === null || value === '' || (Array.isArray(value) && value.length === 0)
  }

  private decimalPlaces(value: number): number {
    const text = value.toString().toLowerCase()
    if (text.includes('e-')) return Number(text.split('e-')[1])
    return text.split('.')[1]?.length ?? 0
  }
}
