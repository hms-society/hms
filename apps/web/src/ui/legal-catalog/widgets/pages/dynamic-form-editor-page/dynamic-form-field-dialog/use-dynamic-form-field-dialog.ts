import type { DynamicFormStage } from '@hms/core/legal-catalog/domain/structures'
import { createDynamicFormSchema } from '@hms/validation/legal-catalog'
import { useEffect, useState } from 'react'
import {
  fieldToRequest,
  makeClientId,
  type DynamicFormEditorField,
  type DynamicFormEditorOptionError,
} from '../types'
import type { DynamicFormFieldDialogProps } from './types'

const ALL_TYPES = [
  'short_text',
  'long_text',
  'date',
  'multiple_selection',
  'boolean',
  'single_selection',
  'integer',
  'currency',
  'percentage',
] as const

const VALIDATION_FORM_IDS = {
  area: '00000000-0000-4000-8000-000000000001',
  topic: '00000000-0000-4000-8000-000000000002',
} as const

type DialogErrors = {
  description?: string
  label?: string
  placeholder?: string
  defaultValue?: string
  validation?: string
  min?: string
  max?: string
  scale?: string
  optionErrors: DynamicFormEditorOptionError[]
}

const EMPTY_ERRORS: DialogErrors = { optionErrors: [] }

type ValidationIssue = {
  code: string
  path: readonly (string | number)[]
  message: string
}

function localizeValidationIssue(issue: ValidationIssue): string {
  if (issue.code === 'custom') return issue.message

  const [key, index, nestedKey] = issue.path
  if (key === 'label') {
    return issue.code === 'too_big'
      ? 'O rótulo do campo deve ter no máximo 160 caracteres.'
      : 'O rótulo do campo é obrigatório.'
  }
  if (key === 'description') {
    return 'A descrição deve ter no máximo 500 caracteres.'
  }
  if (key === 'placeholder') {
    return 'O placeholder deve ter no máximo 160 caracteres.'
  }
  if (key === 'options' && typeof index === 'number' && nestedKey === 'label') {
    return issue.code === 'too_big'
      ? 'O rótulo da opção deve ter no máximo 160 caracteres.'
      : 'Informe o rótulo da opção.'
  }
  if (key === 'options') return 'Adicione pelo menos uma opção.'
  if (key === 'defaultValue') {
    return issue.code === 'invalid_format'
      ? 'Informe uma data válida.'
      : 'Informe um valor padrão válido.'
  }
  if (key === 'validation' && nestedKey === 'min') {
    return 'Informe um valor mínimo válido.'
  }
  if (key === 'validation' && nestedKey === 'max') {
    return 'Informe um valor máximo válido.'
  }
  if (key === 'validation' && nestedKey === 'scale') {
    return 'A escala deve ser um inteiro entre 0 e 4.'
  }
  if (key === 'validation') return 'Informe regras de validação válidas.'
  return 'Revise os dados do campo.'
}

export function emptyField(): DynamicFormEditorField {
  return { clientId: makeClientId(), label: '', type: 'short_text', required: false }
}

function validateField(
  field: DynamicFormEditorField,
  stage: DynamicFormStage,
): DialogErrors {
  const errors: DialogErrors = { ...EMPTY_ERRORS }
  const isSelection =
    field.type === 'single_selection' || field.type === 'multiple_selection'

  if (isSelection) {
    const seenLabels = new Set<string>()
    for (const option of field.options ?? []) {
      const normalizedLabel = option.label.trim().toLocaleLowerCase()
      if (!normalizedLabel || !seenLabels.has(normalizedLabel)) {
        seenLabels.add(normalizedLabel)
        continue
      }
      errors.optionErrors.push({
        optionClientId: option.clientId,
        message: 'Os rótulos das opções devem ser únicos.',
      })
    }

    const optionIds = new Set((field.options ?? []).map((option) => option.clientId))
    const defaultIds = field.defaultOptionClientIds ?? []
    if (
      defaultIds.some((id) => !optionIds.has(id)) ||
      (field.type === 'single_selection' && defaultIds.length > 1)
    ) {
      errors.defaultValue = 'Selecione uma opção válida como padrão.'
    }
  }

  if (field.validation?.min !== undefined && field.validation?.max !== undefined) {
    if (field.validation.min > field.validation.max) {
      errors.validation = 'O mínimo não pode ser maior que o máximo.'
    }
  }
  if (
    field.validation?.scale !== undefined &&
    (!Number.isInteger(field.validation.scale) ||
      field.validation.scale < 0 ||
      field.validation.scale > 4)
  ) {
    errors.scale = 'A escala deve ser um inteiro entre 0 e 4.'
  }
  if (
    field.type === 'integer' &&
    (field.validation?.max !== undefined || field.validation?.scale !== undefined)
  ) {
    errors.validation ??= 'Inteiros aceitam somente o valor mínimo.'
  }
  if (
    field.type === 'percentage' &&
    (field.validation?.min !== undefined || field.validation?.max !== undefined)
  ) {
    errors.validation ??= 'Percentuais usam somente a escala de precisão.'
  }
  if (
    field.type !== 'integer' &&
    field.type !== 'percentage' &&
    field.validation?.scale !== undefined
  ) {
    errors.scale = 'A escala não é compatível com este tipo.'
  }

  const requestField = fieldToValidationRequest(field)
  const result = createDynamicFormSchema.safeParse({
    name: 'Ficha em edição',
    stage,
    legalAreaId: VALIDATION_FORM_IDS.area,
    legalTopicIds: [VALIDATION_FORM_IDS.topic],
    fields: [requestField],
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path
        .slice(2)
        .filter(
          (part): part is string | number =>
            typeof part === 'string' || typeof part === 'number',
        )
      const key = path[0]
      if (key === 'options' && typeof path[1] === 'number') {
        const option = field.options?.[path[1]]
        if (
          option &&
          !errors.optionErrors.some((item) => item.optionClientId === option.clientId)
        ) {
          errors.optionErrors.push({
            optionClientId: option.clientId,
            message: localizeValidationIssue({
              code: issue.code,
              path,
              message: issue.message,
            }),
          })
        }
        continue
      }
      if (key === 'defaultOptionIndex' || key === 'defaultOptionIndexes') {
        errors.defaultValue ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'validation' && path[1] === 'min') {
        errors.min ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'validation' && path[1] === 'max') {
        errors.max ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'validation' && path[1] === 'scale') {
        errors.scale ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'validation') {
        errors.validation ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'label') {
        errors.label ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'description') {
        errors.description ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'placeholder') {
        errors.placeholder ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      } else if (key === 'defaultValue') {
        errors.defaultValue ??= localizeValidationIssue({
          code: issue.code,
          path,
          message: issue.message,
        })
      }
    }
  }
  return errors
}

function fieldToValidationRequest(field: DynamicFormEditorField) {
  return fieldToRequest({
    ...field,
    fieldId: undefined,
    options: field.options?.map((option) => ({
      clientId: option.clientId,
      label: option.label,
    })),
  })
}

function firstError(errors: DialogErrors) {
  return (
    errors.label ??
    errors.description ??
    errors.placeholder ??
    errors.defaultValue ??
    errors.validation ??
    errors.min ??
    errors.max ??
    errors.scale ??
    errors.optionErrors[0]?.message ??
    'Revise os dados do campo.'
  )
}

export function useDynamicFormFieldDialog(props: DynamicFormFieldDialogProps) {
  const [field, setField] = useState<DynamicFormEditorField>(
    props.initialValue ?? emptyField(),
  )
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<DialogErrors>(EMPTY_ERRORS)
  useEffect(() => {
    if (props.open) {
      setField(
        props.initialValue
          ? {
              ...props.initialValue,
              options: props.initialValue.options?.map((option) => ({ ...option })),
            }
          : emptyField(),
      )
      setError(null)
      setErrors(EMPTY_ERRORS)
    }
  }, [props.initialValue, props.open])
  function update(patch: Partial<DynamicFormEditorField>) {
    setField((current) => ({ ...current, ...patch }))
    setError(null)
    setErrors(EMPTY_ERRORS)
  }
  function changeType(type: DynamicFormEditorField['type']) {
    if (field.type === type) return
    const next: DynamicFormEditorField = {
      clientId: field.clientId,
      fieldId: field.fieldId,
      key: field.key,
      label: field.label,
      type,
      required: field.required,
      description: field.description,
    }
    if (type === 'currency') next.currency = 'BRL'
    if (type === 'single_selection' || type === 'multiple_selection') {
      next.options = [{ clientId: makeClientId(), label: '' }]
      next.defaultOptionClientIds = []
    }
    setField(next)
    setError(null)
    setErrors(EMPTY_ERRORS)
  }
  function submit(event?: { preventDefault(): void }) {
    event?.preventDefault()
    const nextErrors = validateField(field, props.stage)
    if (
      nextErrors.label ||
      nextErrors.description ||
      nextErrors.placeholder ||
      nextErrors.defaultValue ||
      nextErrors.validation ||
      nextErrors.min ||
      nextErrors.max ||
      nextErrors.scale ||
      nextErrors.optionErrors.length > 0
    ) {
      setErrors(nextErrors)
      setError(firstError(nextErrors))
      return
    }
    setError(null)
    setErrors(EMPTY_ERRORS)
    props.onSubmit({
      ...field,
      label: field.label.trim(),
      description: field.description?.trim() || undefined,
      placeholder: field.placeholder?.trim() || undefined,
    })
  }
  return {
    field,
    error,
    errors,
    allTypes: ALL_TYPES,
    update,
    changeType,
    submit,
  }
}
