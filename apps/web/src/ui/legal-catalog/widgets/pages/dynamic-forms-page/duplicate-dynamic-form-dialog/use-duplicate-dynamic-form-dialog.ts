import type { DuplicateDynamicFormInput } from '@hms/validation/legal-catalog'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { useDynamicFormNameConflictQuery } from '@/ui/legal-catalog/hooks'

import type { DuplicateDynamicFormDialogProps } from './types'

export function useDuplicateDynamicFormDialog(props: DuplicateDynamicFormDialogProps) {
  const [name, setName] = useState('')
  const conflictQuery = useDynamicFormNameConflictQuery(name, props.open)

  useEffect(() => {
    setName(props.form ? `${props.form.name} — cópia` : '')
  }, [props.form])

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input: DuplicateDynamicFormInput = {
      name: name.trim(),
      operationKey: crypto.randomUUID(),
    }
    await props.onConfirm(input)
  }

  function handleOpenChange(open: boolean) {
    if (!open && !props.isPending) props.onOpenChange(false)
  }

  const conflict = props.conflict ?? conflictQuery.data ?? null
  const hasConflict = Boolean(conflict?.conflict)
  const isInvalid = name.trim().length === 0 || hasConflict || props.isPending

  return {
    name,
    conflict,
    handleNameChange,
    handleSubmit,
    handleOpenChange,
    isInvalid,
    conflictError: hasConflict ? 'Já existe um formulário com este nome.' : null,
  }
}
