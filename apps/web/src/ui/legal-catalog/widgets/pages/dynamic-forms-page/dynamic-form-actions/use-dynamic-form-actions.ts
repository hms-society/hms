import { useRef, useState } from 'react'

import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'

export type DynamicFormActionsProps = {
  form: DynamicFormListItem
  onDuplicate: (form: DynamicFormListItem) => void
  onChangeAvailability: (form: DynamicFormListItem) => void
  onDelete: (form: DynamicFormListItem) => void
}

export function useDynamicFormActions({
  form,
  onDuplicate,
  onChangeAvailability,
  onDelete,
}: DynamicFormActionsProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  function handleDuplicate() {
    onDuplicate(form)
    setIsOpen(false)
  }

  function handleChangeAvailability() {
    onChangeAvailability(form)
    setIsOpen(false)
  }

  function handleDelete() {
    onDelete(form)
    setIsOpen(false)
  }

  return {
    triggerRef,
    isOpen,
    handleOpenChange,
    handleDuplicate,
    handleChangeAvailability,
    handleDelete,
    availabilityLabel:
      form.status === 'available' ? 'Tornar indisponível' : 'Tornar disponível',
  }
}
