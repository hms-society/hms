import type { DocumentTemplateVariable } from '@hms/core/document-production/domain/structures'
import { SYSTEM_DOCUMENT_TEMPLATE_VARIABLES } from '@hms/core/document-production/domain/structures'
import { documentTemplateVariableSchema } from '@hms/validation/document-production'
import { type DragEvent, useMemo, useState } from 'react'

export type VariablePickerProps = {
  variables: readonly DocumentTemplateVariable[]
  onInsert: (name: string) => void
  onAdd: (variable: DocumentTemplateVariable) => void
  onUpdate: (previousTechnicalName: string, variable: DocumentTemplateVariable) => void
  onRemove: (variable: DocumentTemplateVariable) => void
}

type VariableDraft = {
  label: string
  technicalName: string
  description: string
}

function getSystemTechnicalName(variable: DocumentTemplateVariable) {
  if (
    variable.systemTechnicalName &&
    SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.some(
      (systemVariable) => systemVariable.technicalName === variable.systemTechnicalName,
    )
  )
    return variable.systemTechnicalName
  if (
    SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.some(
      (systemVariable) => systemVariable.technicalName === variable.technicalName,
    )
  )
    return variable.technicalName
  return undefined
}

export function useVariablePicker({
  variables,
  onInsert,
  onAdd,
  onUpdate,
  onRemove,
}: VariablePickerProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingTechnicalName, setEditingTechnicalName] = useState<string | null>(null)
  const [editingSystemTechnicalName, setEditingSystemTechnicalName] = useState<
    string | null
  >(null)
  const [removingVariable, setRemovingVariable] =
    useState<DocumentTemplateVariable | null>(null)
  const [draft, setDraft] = useState<VariableDraft>({
    label: '',
    technicalName: '',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const items = useMemo(() => {
    const systemVariables = SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.map((systemVariable) => {
      const override = variables.find(
        (variable) => getSystemTechnicalName(variable) === systemVariable.technicalName,
      )
      return (
        override ?? {
          ...systemVariable,
          systemTechnicalName: systemVariable.technicalName,
        }
      )
    })
    const customVariables = variables.filter(
      (variable) => !getSystemTechnicalName(variable),
    )
    return [...systemVariables, ...customVariables].filter(
      (variable) =>
        !variable.isRemoved &&
        [variable.label, variable.technicalName, variable.description]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
  }, [search, variables])
  const availableCount = items.length

  function suggestTechnicalName(label: string) {
    return label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }

  function handleAdd() {
    setEditingTechnicalName(null)
    setEditingSystemTechnicalName(null)
    setDraft({ label: '', technicalName: '', description: '' })
    setErrors({})
    setOpen(true)
  }

  function handleEdit(variable: DocumentTemplateVariable) {
    setEditingTechnicalName(variable.technicalName)
    setEditingSystemTechnicalName(getSystemTechnicalName(variable) ?? null)
    setDraft({
      label: variable.label,
      technicalName: variable.technicalName,
      description: variable.description ?? '',
    })
    setErrors({})
    setOpen(true)
  }

  function handleLabelChange(label: string) {
    setDraft((current) => ({
      ...current,
      label,
      technicalName: suggestTechnicalName(label),
    }))
  }

  function handleTechnicalNameChange(value: string) {
    const technicalName = suggestTechnicalName(
      value.replace(/^\{\{/, '').replace(/\}\}$/, ''),
    )
    setDraft((current) => ({ ...current, technicalName }))
  }

  function handleDescriptionChange(description: string) {
    setDraft((current) => ({ ...current, description }))
  }

  function handleVariableDragStart(event: DragEvent<HTMLElement>, technicalName: string) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-hms-template-variable', technicalName)
    event.dataTransfer.setData('text/plain', `{{${technicalName}}}`)
  }

  function submitVariable() {
    const parsed = documentTemplateVariableSchema.safeParse(draft)
    const nextErrors: Record<string, string> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0] ?? 'label')] = issue.message
      }
    }
    const technicalName = draft.technicalName.trim()
    const isEditingSameVariable = editingTechnicalName === technicalName
    if (
      SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.some(
        (variable) => variable.technicalName === technicalName,
      ) &&
      !isEditingSameVariable
    )
      nextErrors.technicalName = 'Esse nome é reservado para uma variável do sistema.'
    else if (
      variables.some(
        (variable) => variable.technicalName === technicalName && !isEditingSameVariable,
      )
    )
      nextErrors.technicalName = 'Esse nome técnico já foi usado neste modelo.'
    setErrors(nextErrors)
    if (!parsed.success || Object.keys(nextErrors).length > 0) return
    const nextVariable = editingSystemTechnicalName
      ? { ...parsed.data, systemTechnicalName: editingSystemTechnicalName }
      : parsed.data
    if (editingTechnicalName) onUpdate(editingTechnicalName, nextVariable)
    else onAdd(parsed.data)
    setOpen(false)
    setEditingTechnicalName(null)
    setEditingSystemTechnicalName(null)
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setEditingTechnicalName(null)
      setEditingSystemTechnicalName(null)
    }
  }

  function handleCancel() {
    setOpen(false)
    setEditingTechnicalName(null)
    setEditingSystemTechnicalName(null)
  }

  function handleRemoveRequest(variable: DocumentTemplateVariable) {
    setRemovingVariable(variable)
  }

  function handleRemoveDialogChange(nextOpen: boolean) {
    if (!nextOpen) setRemovingVariable(null)
  }

  function handleRemoveConfirm() {
    if (!removingVariable) return
    onRemove(removingVariable)
    setRemovingVariable(null)
  }

  return {
    availableCount,
    draft,
    editingTechnicalName,
    errors,
    handleAdd,
    handleCancel,
    handleDescriptionChange,
    handleDialogOpenChange,
    handleEdit,
    handleLabelChange,
    handleTechnicalNameChange,
    handleVariableDragStart,
    handleRemoveConfirm,
    handleRemoveDialogChange,
    handleRemoveRequest,
    items,
    onInsert,
    open,
    removingVariable,
    search,
    setSearch,
    submitVariable,
  }
}
