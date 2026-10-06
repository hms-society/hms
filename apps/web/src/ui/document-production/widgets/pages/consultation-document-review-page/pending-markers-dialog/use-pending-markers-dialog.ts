import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { PendingMarkersDialogProps } from './types/pending-markers-dialog-props'

const PENDING_MARKER_LABELS: Readonly<Record<string, string>> = {
  area_juridica: 'Área jurídica',
  cliente_cpf: 'CPF do cliente',
  cliente_nome: 'Nome do cliente',
  endereco_imovel_comercial: 'Endereço do imóvel comercial',
  orientacao_fornecida: 'Orientação fornecida',
  questao_juridica_principal: 'Questão jurídica principal',
  tema_juridico: 'Tema jurídico',
  valor_honorarios: 'Valor dos honorários',
}

export function usePendingMarkersDialog({
  isRemoving,
  onOpenChange,
  onFill,
}: Pick<PendingMarkersDialogProps, 'isRemoving' | 'onOpenChange' | 'onFill'>) {
  const [editingMarker, setEditingMarker] = useState<string>()
  const [value, setValue] = useState('')

  function getPendingMarkerLabel(marker: string) {
    const technicalName = marker.replace(/^\{+|\}+$/g, '')
    const knownLabel = PENDING_MARKER_LABELS[technicalName]
    if (knownLabel) return knownLabel

    return technicalName
      .split('_')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) handleCancelFilling()
    onOpenChange(nextOpen)
  }

  function handleStartFilling(marker: string) {
    setEditingMarker(marker)
    setValue('')
  }

  function handleCancelFilling() {
    setEditingMarker(undefined)
    setValue('')
  }

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingMarker && value.trim() && !isRemoving) onFill(editingMarker, value)
  }

  return {
    editingMarker,
    value,
    handleOpenChange,
    handleStartFilling,
    handleCancelFilling,
    handleValueChange,
    handleSubmit,
    getPendingMarkerLabel,
  }
}
