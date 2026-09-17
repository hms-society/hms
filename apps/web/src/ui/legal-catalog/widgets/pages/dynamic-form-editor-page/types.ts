import type { ReactNode } from 'react'
import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormFieldType } from '@hms/core/shared/domain/structures'
import type { DynamicFormStage } from '@hms/core/legal-catalog/domain/structures'
import type { DynamicFormFieldValidation } from '@hms/core/shared/domain/structures'

export type DynamicFormEditorPageProps =
  | { mode: 'create'; dynamicFormId?: never; isValidId?: never }
  | { mode: 'edit'; dynamicFormId: string; isValidId?: boolean }

export type DynamicFormEditorSaveState =
  | { kind: 'saved' }
  | { kind: 'dirty'; isValid: boolean }
  | { kind: 'saving' }
  | { kind: 'failure'; failedOperationKey: string; message: string }

export type DynamicFormEditorOverlayState =
  | { kind: 'closed' }
  | { kind: 'field'; mode: 'create' | 'edit'; fieldIndex?: number }
  | { kind: 'remove-field'; fieldClientId: string }
  | { kind: 'unsaved-navigation' }
  | { kind: 'stale-version'; expectedVersion: number; currentVersion: number }
  | { kind: 'delete-form' }

export type DynamicFormEditorOption = {
  clientId: string
  optionId?: string
  value?: string
  label: string
}

export type DynamicFormEditorField = {
  clientId: string
  fieldId?: string
  key?: string
  label: string
  type: DynamicFormFieldType
  required: boolean
  description?: string
  placeholder?: string
  defaultValue?: string | number | boolean
  defaultOptionClientIds?: readonly string[]
  options?: DynamicFormEditorOption[]
  validation?: DynamicFormFieldValidation
  currency?: 'BRL'
}

function fieldValidationToRequest(
  type: DynamicFormEditorField['type'],
  validation: DynamicFormFieldValidation | undefined,
): DynamicFormFieldValidation | undefined {
  if (!validation || type === 'currency') return undefined

  if (type === 'percentage') {
    const { requiredWhen, scale } = validation
    if (requiredWhen === undefined && scale === undefined) return undefined
    return {
      ...(scale !== undefined ? { scale } : {}),
      ...(requiredWhen !== undefined ? { requiredWhen } : {}),
    }
  }

  if (type === 'integer') {
    const { min, requiredWhen } = validation
    if (min === undefined && requiredWhen === undefined) return undefined
    return {
      ...(min !== undefined ? { min } : {}),
      ...(requiredWhen !== undefined ? { requiredWhen } : {}),
    }
  }

  return validation
}

export type DynamicFormFieldListProps = {
  fields: readonly DynamicFormEditorField[]
  preview?: ReactNode
  onEdit: (fieldClientId: string) => void
  onRemove: (fieldClientId: string) => void
  onMove: (fieldClientId: string, targetIndex: number) => void
}

export type DynamicFormFieldRowProps = {
  field: DynamicFormEditorField
  index: number
  count: number
  onEdit: () => void
  onRemove: () => void
  onMove: (targetIndex: number) => void
}

export type DynamicFormEditorOptionError = { optionClientId: string; message: string }

export type DynamicFormOptionsEditorProps = {
  mode: 'single_selection' | 'multiple_selection'
  options: readonly DynamicFormEditorOption[]
  defaultOptionClientIds: readonly string[]
  isDisabled: boolean
  errors: readonly DynamicFormEditorOptionError[]
  onChange: (input: {
    options: DynamicFormEditorOption[]
    defaultOptionClientIds: string[]
  }) => void
}

export type DynamicFormTextFieldConfigurationProps = {
  fieldClientId: string
  type: 'short_text' | 'long_text'
  placeholder?: string
  defaultValue?: string
  isDisabled: boolean
  placeholderError?: string
  defaultValueError?: string
  onPlaceholderChange: (value: string | undefined) => void
  onDefaultValueChange: (value: string | undefined) => void
}
export type DynamicFormDateFieldConfigurationProps = {
  fieldClientId: string
  defaultValue?: string
  isDisabled: boolean
  defaultValueError?: string
  onDefaultValueChange: (value: string | undefined) => void
}
export type DynamicFormBooleanFieldConfigurationProps = {
  fieldClientId: string
  defaultValue?: boolean
  isDisabled: boolean
  defaultValueError?: string
  onDefaultValueChange: (value: boolean | undefined) => void
}
export type DynamicFormSelectionFieldConfigurationProps = {
  fieldClientId: string
  mode: 'single_selection' | 'multiple_selection'
  options: readonly DynamicFormEditorOption[]
  defaultOptionClientIds: readonly string[]
  isDisabled: boolean
  defaultValueError?: string
  optionErrors: readonly DynamicFormEditorOptionError[]
  onChange: DynamicFormOptionsEditorProps['onChange']
}
export type DynamicFormNumericFieldConfigurationProps = {
  fieldClientId: string
  type: 'integer' | 'currency' | 'percentage'
  placeholder?: string
  defaultValue?: number
  validation?: DynamicFormFieldValidation
  currency?: 'BRL'
  isDisabled: boolean
  errors: Readonly<
    Partial<
      Record<
        'placeholder' | 'defaultValue' | 'min' | 'max' | 'scale' | 'validation',
        string
      >
    >
  >
  onDefaultValueChange: (value: number | undefined) => void
  onPlaceholderChange?: (value: string | undefined) => void
  onValidationChange: (value: DynamicFormFieldValidation | undefined) => void
}

export type DynamicFormPreviewProps = { fields: readonly DynamicFormEditorField[] }
export type DynamicFormFieldRemovalDialogProps = {
  open: boolean
  dynamicFormId?: string
  field: DynamicFormEditorField | null
  onOpenChange: (open: boolean) => void
  onConfirm: (fieldClientId: string) => void
}
export type DynamicFormUnsavedChangesDialogProps = {
  open: boolean
  onContinueEditing: () => void
  onDiscardChanges: () => void
}
export type DynamicFormStaleVersionDialogProps = {
  open: boolean
  expectedVersion: number
  currentVersion: number
  isReloading: boolean
  errorMessage: string | null
  onContinueEditing: () => void
  onReloadServerVersion: () => Promise<void>
}
export type DynamicFormDeleteDialogProps = {
  open: boolean
  form: DynamicForm | null
  isDirty: boolean
  isDeleting?: boolean
  errorMessage?: string | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}
export type DynamicFormSaveBarProps = {
  state: DynamicFormEditorSaveState
  canDelete: boolean
  onSave: () => void
  onRetry: () => void
  onDelete: () => void
}

export function makeClientId() {
  return crypto.randomUUID()
}

export function hydrateField(
  field: DynamicForm['fields'][number],
): DynamicFormEditorField {
  const options = field.options?.map((option) => ({
    clientId: makeClientId(),
    optionId: option.id,
    value: option.value,
    label: option.label,
  }))
  const defaults = Array.isArray(field.defaultValue)
    ? field.defaultValue
        .map((value) => options?.find((option) => option.value === value)?.clientId)
        .filter(Boolean)
        .map(String)
    : typeof field.defaultValue === 'string'
      ? options?.find((option) => option.value === field.defaultValue)?.clientId
        ? [
            String(
              options.find((option) => option.value === field.defaultValue)?.clientId,
            ),
          ]
        : []
      : []
  return {
    clientId: makeClientId(),
    fieldId: field.id,
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    description: field.description,
    placeholder: field.placeholder,
    defaultValue:
      typeof field.defaultValue === 'string' ||
      typeof field.defaultValue === 'number' ||
      typeof field.defaultValue === 'boolean'
        ? field.defaultValue
        : undefined,
    defaultOptionClientIds: defaults,
    options,
    validation: field.validation,
    currency: field.currency,
  }
}

export function fieldToRequest(field: DynamicFormEditorField) {
  const validation = fieldValidationToRequest(field.type, field.validation)
  const base = {
    ...(field.fieldId ? { fieldId: field.fieldId } : {}),
    label: field.label.trim(),
    required: field.required,
    ...(field.description?.trim() ? { description: field.description.trim() } : {}),
    ...(validation ? { validation } : {}),
  }
  if (field.type === 'single_selection' || field.type === 'multiple_selection') {
    const options = (field.options ?? []).map((option) => ({
      ...(option.optionId ? { optionId: option.optionId } : {}),
      label: option.label.trim(),
    }))
    const selected = field.defaultOptionClientIds ?? []
    const indexes = selected
      .map(
        (clientId) =>
          field.options?.findIndex((option) => option.clientId === clientId) ?? -1,
      )
      .filter((index) => index >= 0)

    return field.type === 'single_selection'
      ? {
          ...base,
          type: field.type,
          placeholder: field.placeholder?.trim() || undefined,
          options,
          defaultOptionIndex: indexes[0],
        }
      : { ...base, type: field.type, options, defaultOptionIndexes: indexes }
  }
  if (field.type === 'currency') {
    return {
      ...base,
      type: field.type,
      currency: 'BRL' as const,
      placeholder: field.placeholder?.trim() || undefined,
      defaultValue: field.defaultValue as number | undefined,
    }
  }
  if (field.type === 'integer' || field.type === 'percentage') {
    return {
      ...base,
      type: field.type,
      placeholder: field.placeholder?.trim() || undefined,
      defaultValue: field.defaultValue as number | undefined,
    }
  }
  return {
    ...base,
    type: field.type,
    ...(field.type === 'short_text' || field.type === 'long_text'
      ? { placeholder: field.placeholder?.trim() || undefined }
      : {}),
    defaultValue: field.defaultValue,
  }
}

export function toDefinitionRequest(input: {
  name: string
  description: string
  stage: DynamicFormStage
  legalAreaId: string
  legalTopicIds: string[]
  fields: readonly DynamicFormEditorField[]
}) {
  return {
    name: input.name.trim(),
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    stage: input.stage,
    legalAreaId: input.legalAreaId,
    legalTopicIds: input.legalTopicIds,
    fields: input.fields.map(fieldToRequest),
  }
}
