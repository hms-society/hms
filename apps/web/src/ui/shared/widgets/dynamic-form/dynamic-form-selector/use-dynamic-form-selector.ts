import type { DynamicFormSelectorProps } from './types'

export function useDynamicFormSelector({
  legalArea,
  legalTheme,
  isReadOnly = false,
  onOpenSelectModal,
}: DynamicFormSelectorProps) {
  const context = [legalArea, legalTheme].filter(Boolean).join(' · ')

  return {
    context,
    handleOpenSelectModal: onOpenSelectModal,
    isDisabled: isReadOnly,
  }
}
