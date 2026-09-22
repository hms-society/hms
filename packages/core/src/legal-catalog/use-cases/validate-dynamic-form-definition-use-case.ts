import type { DynamicForm } from '../domain/entities/dynamic-form'
import type { DynamicFormDefinitionField } from '../domain/entities/dynamic-form-definition-field'
import type { DynamicFormDefinitionOption } from '../domain/entities/dynamic-form-definition-option'
import { DynamicFormDefinitionValidationError } from '../domain/errors'
import type { DynamicFormDefinitionDraft } from '../domain/structures/dynamic-form-definition-draft'
import type { DynamicFormFieldValidation } from '#shared/domain/structures/dynamic-form-field-validation'
import { DynamicFormFieldType } from '#shared/domain/structures/dynamic-form-field-type'
import type { DynamicFormValidationIssue } from '#shared/domain/structures/dynamic-form-validation-issue'
import type { IdProvider } from '#shared/interfaces/id-provider'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  draft: DynamicFormDefinitionDraft
  existingForm?: DynamicForm
}

export class ValidateDynamicFormDefinitionUseCase
  implements UseCase<Request, DynamicFormDefinitionField[]>
{
  static readonly FIELD_TYPES = Object.values(DynamicFormFieldType)

  constructor(private readonly idProvider: IdProvider) {}

  async execute({ draft, existingForm }: Request): Promise<DynamicFormDefinitionField[]> {
    const issues: DynamicFormValidationIssue[] = []
    const normalizedName = draft.name.trim()

    if (!normalizedName || normalizedName.length > 160) {
      issues.push({ path: 'name', message: 'Informe um nome entre 1 e 160 caracteres.' })
    }

    this.normalizeDescription(draft.description, issues)
    if (!Array.isArray(draft.fields) || draft.fields.length === 0) {
      issues.push({ path: 'fields', message: 'Adicione pelo menos um campo.' })
    }
    if (!draft.legalAreaId) {
      issues.push({ path: 'legalAreaId', message: 'Selecione uma área jurídica.' })
    }
    if (!Array.isArray(draft.legalTopicIds) || draft.legalTopicIds.length === 0) {
      issues.push({
        path: 'legalTopicIds',
        message: 'Selecione pelo menos um assunto jurídico.',
      })
    }
    if (new Set(draft.legalTopicIds ?? []).size !== (draft.legalTopicIds ?? []).length) {
      issues.push({
        path: 'legalTopicIds',
        message: 'Os assuntos jurídicos não podem se repetir.',
      })
    }
    if (existingForm && draft.stage !== existingForm.stage) {
      issues.push({ path: 'stage', message: 'A etapa da ficha não pode ser alterada.' })
    }

    const fields = this.normalizeFields(draft, existingForm, issues)
    const fieldKeys = new Set(fields.map((field) => field.key))
    for (const field of fields) {
      const requiredWhen = field.validation?.requiredWhen
      if (requiredWhen && !fieldKeys.has(requiredWhen.fieldKey)) {
        issues.push({
          path: `field:${field.id}.validation.requiredWhen`,
          message: `A regra condicional do campo ${field.key} referencia um campo removido.`,
        })
      }
      if (requiredWhen?.fieldKey === field.key) {
        issues.push({
          path: `field:${field.id}.validation.requiredWhen`,
          message: `A regra condicional do campo ${field.key} não pode referenciar a si mesma.`,
        })
      }
    }

    if (issues.length > 0) throw new DynamicFormDefinitionValidationError(issues)

    return fields.map((field, position) => ({ ...field, position }))
  }

  private normalizeDescription(
    value: string | undefined,
    issues: DynamicFormValidationIssue[],
  ): string | undefined {
    if (value === undefined) return undefined
    const description = value.trim()
    if (description.length > 500) {
      issues.push({
        path: 'description',
        message: 'A descrição pode ter no máximo 500 caracteres.',
      })
    }
    return description || undefined
  }

  private normalizeFields(
    draft: DynamicFormDefinitionDraft,
    existingForm: DynamicForm | undefined,
    issues: DynamicFormValidationIssue[],
  ): DynamicFormDefinitionField[] {
    const fieldIds = new Set<string>()
    const fieldKeys = new Set<string>()
    const existingFields = new Map(
      existingForm?.fields.map((field) => [field.id, field]) ?? [],
    )

    return (draft.fields ?? []).map((draftField, index) => {
      const path = `fields.${index}`
      const existingField = draftField.fieldId
        ? existingFields.get(draftField.fieldId)
        : undefined
      if (draftField.fieldId && !existingField) {
        issues.push({
          path: `${path}.fieldId`,
          message: 'O campo informado não existe nesta ficha.',
        })
      }
      if (draftField.fieldId && fieldIds.has(draftField.fieldId)) {
        issues.push({
          path: `${path}.fieldId`,
          message: 'O campo foi informado mais de uma vez.',
        })
      }

      const label = draftField.label.trim()
      if (!label || label.length > 160) {
        issues.push({
          path: `${path}.label`,
          message: 'Informe um rótulo entre 1 e 160 caracteres.',
        })
      }

      if (!ValidateDynamicFormDefinitionUseCase.FIELD_TYPES.includes(draftField.type)) {
        issues.push({
          path: `${path}.type`,
          message: 'O tipo de campo informado é inválido.',
        })
      }
      const id = existingField?.id ?? draftField.fieldId ?? this.idProvider.generate()
      if (fieldIds.has(id)) {
        issues.push({
          path: `${path}.fieldId`,
          message: 'Os identificadores dos campos devem ser únicos.',
        })
      }
      fieldIds.add(id)

      const key =
        existingField?.key ?? this.createUniqueIdentifier(label, fieldKeys, 'field')
      if (fieldKeys.has(key)) {
        issues.push({
          path: `${path}.label`,
          message: 'Os identificadores técnicos dos campos devem ser únicos.',
        })
      }
      fieldKeys.add(key)

      const validation = this.normalizeValidation(draftField, existingField, path, issues)
      const description = this.normalizeDescription(draftField.description, issues)
      const common = {
        id,
        key,
        label,
        type: draftField.type,
        position: index,
        required: draftField.required,
        ...(description ? { description } : {}),
        ...(validation ? { validation } : {}),
      }

      return this.normalizeFieldType(common, draftField, existingField, path, issues)
    })
  }

  private normalizeFieldType(
    common: Omit<DynamicFormDefinitionField, 'type'> & {
      type: DynamicFormDefinitionField['type']
    },
    draftField: DynamicFormDefinitionDraft['fields'][number],
    existingField: DynamicFormDefinitionField | undefined,
    path: string,
    issues: DynamicFormValidationIssue[],
  ): DynamicFormDefinitionField {
    const placeholder =
      'placeholder' in draftField
        ? this.normalizeOptionalText(
            draftField.placeholder,
            `${path}.placeholder`,
            issues,
            160,
          )
        : undefined
    const defaultValue =
      'defaultValue' in draftField
        ? this.normalizeDefaultValue(draftField, path, issues)
        : undefined
    const hasOptions = 'options' in draftField
    const hasPlaceholder = 'placeholder' in draftField
    const hasCurrency = 'currency' in draftField
    const isSelection =
      draftField.type === 'single_selection' || draftField.type === 'multiple_selection'

    if (hasOptions !== isSelection) {
      issues.push({
        path: `${path}.options`,
        message: isSelection
          ? 'Campos de seleção precisam declarar opções.'
          : 'Este tipo de campo não pode declarar opções.',
      })
    }
    if (
      hasPlaceholder &&
      ![
        'short_text',
        'long_text',
        'single_selection',
        'integer',
        'currency',
        'percentage',
      ].includes(draftField.type)
    ) {
      issues.push({
        path: `${path}.placeholder`,
        message: 'Este tipo de campo não aceita placeholder.',
      })
    }
    if (hasCurrency && draftField.type !== 'currency') {
      issues.push({
        path: `${path}.currency`,
        message: 'A moeda só pode ser informada em campos monetários.',
      })
    }
    if ('defaultValue' in draftField && isSelection) {
      issues.push({
        path: `${path}.defaultValue`,
        message: 'Campos de seleção usam o índice da opção padrão.',
      })
    }

    if (
      draftField.type === 'single_selection' ||
      draftField.type === 'multiple_selection'
    ) {
      const options = this.normalizeOptions(
        draftField.options,
        existingField,
        path,
        issues,
      )
      const selectionDefault = this.normalizeSelectionDefault(
        draftField,
        options,
        path,
        issues,
      )
      return {
        ...common,
        ...(draftField.type === 'single_selection' && placeholder ? { placeholder } : {}),
        options,
        ...(selectionDefault !== undefined ? { defaultValue: selectionDefault } : {}),
      }
    }

    if (draftField.type === 'currency') {
      return {
        ...common,
        ...(placeholder ? { placeholder } : {}),
        currency: 'BRL',
        ...(defaultValue !== undefined ? { defaultValue } : {}),
      }
    }

    if (draftField.type === 'short_text' || draftField.type === 'long_text') {
      return {
        ...common,
        ...(placeholder ? { placeholder } : {}),
        ...(defaultValue !== undefined ? { defaultValue } : {}),
      }
    }

    return {
      ...common,
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    }
  }

  private normalizeOptionalText(
    value: string | undefined,
    path: string,
    issues: DynamicFormValidationIssue[],
    maxLength: number,
  ): string | undefined {
    if (value === undefined) return undefined
    const normalized = value.trim()
    if (normalized.length > maxLength) {
      issues.push({
        path,
        message: `O texto pode ter no máximo ${maxLength} caracteres.`,
      })
    }
    return normalized || undefined
  }

  private normalizeOptions(
    optionDrafts: { optionId?: string; label: string }[],
    existingField: DynamicFormDefinitionField | undefined,
    path: string,
    issues: DynamicFormValidationIssue[],
  ): DynamicFormDefinitionOption[] {
    const existingOptions = new Map(
      existingField?.options?.map((option) => [option.id, option]) ?? [],
    )
    const optionIds = new Set<string>()
    const optionValues = new Set<string>()

    if (!optionDrafts || optionDrafts.length === 0) {
      issues.push({
        path: `${path}.options`,
        message: 'Adicione pelo menos uma opção de seleção.',
      })
    }

    return (optionDrafts ?? []).map((optionDraft, index) => {
      const optionPath = `${path}.options.${index}`
      const existingOption = optionDraft.optionId
        ? existingOptions.get(optionDraft.optionId)
        : undefined
      if (optionDraft.optionId && !existingOption) {
        issues.push({
          path: `${optionPath}.optionId`,
          message: 'A opção informada não existe neste campo.',
        })
      }
      if (optionDraft.optionId && optionIds.has(optionDraft.optionId)) {
        issues.push({
          path: `${optionPath}.optionId`,
          message: 'A opção foi informada mais de uma vez.',
        })
      }

      const label = optionDraft.label.trim()
      if (!label || label.length > 160) {
        issues.push({
          path: `${optionPath}.label`,
          message: 'Informe um rótulo entre 1 e 160 caracteres.',
        })
      }
      const id = existingOption?.id ?? optionDraft.optionId ?? this.idProvider.generate()
      const value =
        existingOption?.value ??
        this.createUniqueIdentifier(label, optionValues, 'option')
      if (optionIds.has(id)) {
        issues.push({
          path: `${optionPath}.optionId`,
          message: 'Os identificadores das opções devem ser únicos.',
        })
      }
      if (optionValues.has(value)) {
        issues.push({
          path: `${optionPath}.label`,
          message: 'Os valores das opções devem ser únicos.',
        })
      }
      optionIds.add(id)
      optionValues.add(value)

      return { id, value, label, position: index }
    })
  }

  private normalizeSelectionDefault(
    field: Extract<
      DynamicFormDefinitionDraft['fields'][number],
      { type: 'single_selection' | 'multiple_selection' }
    >,
    options: DynamicFormDefinitionOption[],
    path: string,
    issues: DynamicFormValidationIssue[],
  ): string | string[] | undefined {
    if (field.type === 'single_selection') {
      if (field.defaultOptionIndex === undefined) return undefined
      if (!this.isValidOptionIndex(field.defaultOptionIndex, options.length)) {
        issues.push({
          path: `${path}.defaultOptionIndex`,
          message: 'Selecione uma opção válida como padrão.',
        })
        return undefined
      }
      return options[field.defaultOptionIndex].value
    }

    if (
      field.defaultOptionIndexes === undefined ||
      field.defaultOptionIndexes.length === 0
    ) {
      return undefined
    }
    const indexes = field.defaultOptionIndexes
    if (
      indexes.some((index) => !this.isValidOptionIndex(index, options.length)) ||
      indexes.some((index, position) => position > 0 && index <= indexes[position - 1])
    ) {
      issues.push({
        path: `${path}.defaultOptionIndexes`,
        message: 'Os padrões devem referenciar opções válidas em ordem crescente.',
      })
      return undefined
    }
    return indexes.map((index) => options[index].value)
  }

  private normalizeDefaultValue(
    field: DynamicFormDefinitionDraft['fields'][number],
    path: string,
    issues: DynamicFormValidationIssue[],
  ): string | number | boolean | undefined {
    if (!('defaultValue' in field) || field.defaultValue === undefined) return undefined
    const value = field.defaultValue

    if (field.type === 'short_text' || field.type === 'long_text') {
      if (typeof value !== 'string' || !value.trim()) {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'Informe um texto padrão válido.',
        })
        return undefined
      }
      return value.trim()
    }
    if (field.type === 'date') {
      if (typeof value !== 'string' || !this.isValidDate(value)) {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'Informe uma data padrão válida.',
        })
        return undefined
      }
      return value
    }
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'Informe um valor booleano padrão válido.',
        })
        return undefined
      }
      return value
    }
    if (field.type === 'integer') {
      if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'Informe um número inteiro padrão válido.',
        })
        return undefined
      }
      if (field.validation?.min !== undefined && value < field.validation.min) {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'O padrão deve respeitar o valor mínimo.',
        })
        return undefined
      }
      return value
    }
    if (field.type === 'currency') {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        this.decimalPlaces(value) > 2
      ) {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'Informe um valor BRL válido com até duas casas decimais.',
        })
        return undefined
      }
      return value
    }
    if (field.type === 'percentage') {
      const scale = field.validation?.scale ?? 2
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100 ||
        this.decimalPlaces(value) > scale
      ) {
        issues.push({
          path: `${path}.defaultValue`,
          message: 'Informe um percentual entre 0 e 100 com precisão válida.',
        })
        return undefined
      }
      return value
    }
    return undefined
  }

  private normalizeValidation(
    field: DynamicFormDefinitionDraft['fields'][number],
    existingField: DynamicFormDefinitionField | undefined,
    path: string,
    issues: DynamicFormValidationIssue[],
  ): DynamicFormFieldValidation | undefined {
    const submitted = field.validation
    const existing = existingField?.validation
    const submittedRequiredWhen = submitted?.requiredWhen
    const existingRequiredWhen = existing?.requiredWhen
    if (
      submittedRequiredWhen &&
      (!existingRequiredWhen ||
        submittedRequiredWhen.fieldKey !== existingRequiredWhen.fieldKey ||
        submittedRequiredWhen.equals !== existingRequiredWhen.equals)
    ) {
      issues.push({
        path: `${path}.validation.requiredWhen`,
        message:
          'Regras condicionais existentes não podem ser criadas ou alteradas no editor.',
      })
    }
    if (existingRequiredWhen && field.fieldId && field.type !== existingField?.type) {
      issues.push({
        path: `${path}.type`,
        message:
          'Não é possível alterar o tipo de um campo com regra condicional existente.',
      })
    }

    const typeChanged = existingField !== undefined && field.type !== existingField.type
    const inheritedValidation = typeChanged ? {} : (existing ?? {})
    const validation = {
      ...inheritedValidation,
      ...(submitted ?? {}),
      ...(existingRequiredWhen && !submittedRequiredWhen
        ? { requiredWhen: existingRequiredWhen }
        : {}),
    }
    const hasNumericInput =
      submitted?.min !== undefined ||
      submitted?.max !== undefined ||
      submitted?.scale !== undefined
    const isSelection =
      field.type === 'single_selection' || field.type === 'multiple_selection'
    const isTextual =
      field.type === 'short_text' ||
      field.type === 'long_text' ||
      field.type === 'date' ||
      field.type === 'boolean'

    if ((isTextual || isSelection || field.type === 'currency') && hasNumericInput) {
      issues.push({
        path: `${path}.validation`,
        message: 'As regras numéricas não são compatíveis com este tipo.',
      })
    }
    if (field.type === 'integer') {
      if (submitted?.max !== undefined || submitted?.scale !== undefined) {
        issues.push({
          path: `${path}.validation`,
          message: 'Inteiros aceitam somente o valor mínimo.',
        })
      }
      if (submitted?.min !== undefined && !Number.isSafeInteger(submitted.min)) {
        issues.push({
          path: `${path}.validation.min`,
          message: 'O mínimo inteiro é inválido.',
        })
      }
    }
    if (field.type === 'percentage') {
      if (submitted?.min !== undefined || submitted?.max !== undefined) {
        issues.push({
          path: `${path}.validation`,
          message: 'Percentuais usam somente a escala de precisão.',
        })
      }
    }
    if (
      field.type !== 'percentage' &&
      submitted?.scale !== undefined &&
      field.type !== 'integer'
    ) {
      issues.push({
        path: `${path}.validation.scale`,
        message: 'A escala não é compatível com este tipo.',
      })
    }
    if (
      submitted?.min !== undefined &&
      submitted?.max !== undefined &&
      submitted.min > submitted.max
    ) {
      issues.push({
        path: `${path}.validation`,
        message: 'O mínimo não pode ser maior que o máximo.',
      })
    }
    if (
      submitted?.scale !== undefined &&
      (!Number.isInteger(submitted.scale) || submitted.scale < 0 || submitted.scale > 4)
    ) {
      issues.push({
        path: `${path}.validation.scale`,
        message: 'A escala deve ser um inteiro entre 0 e 4.',
      })
    }

    if (field.type === 'percentage' && validation.scale === undefined) {
      validation.scale = 2
    }
    return Object.keys(validation).length > 0 ? validation : undefined
  }

  private createUniqueIdentifier(
    label: string,
    usedIdentifiers: Set<string>,
    fallback: string,
  ): string {
    const normalized = this.normalizeIdentifier(label) || fallback
    let candidate = normalized
    let suffix = 2
    while (usedIdentifiers.has(candidate)) candidate = `${normalized}_${suffix++}`
    return candidate
  }

  private normalizeIdentifier(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  private isValidOptionIndex(index: number, optionCount: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < optionCount
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }

  private decimalPlaces(value: number): number {
    const valueAsString = value.toString().toLowerCase()
    if (valueAsString.includes('e-')) return Number(valueAsString.split('e-')[1])
    return valueAsString.split('.')[1]?.length ?? 0
  }
}
