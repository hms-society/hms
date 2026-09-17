import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useCallback } from 'react'
import { useState } from 'react'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { makeClientId, type DynamicFormOptionsEditorProps } from '../../../types'

export function useDynamicFormOptionsEditor(props: DynamicFormOptionsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const change = useCallback(
    (options: DynamicFormOptionsEditorProps['options']) => {
      const validIds = new Set(options.map((option) => option.clientId))
      const defaults = props.defaultOptionClientIds.filter((id) => validIds.has(id))
      props.onChange({
        options: options.map((option) => ({ ...option })),
        defaultOptionClientIds:
          props.mode === 'single_selection' ? defaults.slice(0, 1) : defaults,
      })
    },
    [props],
  )
  function addOption() {
    change([...props.options, { clientId: makeClientId(), label: '' }])
  }
  function removeOption(clientId: string) {
    if (props.options.length <= 1) return
    change(props.options.filter((option) => option.clientId !== clientId))
  }
  function moveOption(clientId: string, targetIndex: number) {
    const from = props.options.findIndex((option) => option.clientId === clientId)
    if (from < 0 || targetIndex < 0 || targetIndex >= props.options.length) return
    const options = [...props.options]
    const [option] = options.splice(from, 1)
    if (option) options.splice(targetIndex, 0, option)
    change(options)
  }
  function toggleDefault(clientId: string) {
    const defaults =
      props.mode === 'single_selection'
        ? [clientId]
        : props.defaultOptionClientIds.includes(clientId)
          ? props.defaultOptionClientIds.filter((id) => id !== clientId)
          : [...props.defaultOptionClientIds, clientId]
    props.onChange({
      options: props.options.map((option) => ({ ...option })),
      defaultOptionClientIds: defaults,
    })
  }

  function optionLabel(id: string | number) {
    return (
      props.options.find((option) => option.clientId === String(id))?.label || 'sem nome'
    )
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const targetIndex = props.options.findIndex(
      (option) => option.clientId === String(over.id),
    )
    moveOption(String(active.id), targetIndex)
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Opção ${optionLabel(active.id)} selecionada. Use as setas para mover e Espaço para soltar.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Opção ${optionLabel(active.id)} sobre a opção ${optionLabel(over.id)}.`
        : `Opção ${optionLabel(active.id)} fora da lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Opção ${optionLabel(active.id)} colocada na posição de ${optionLabel(over.id)}.`
        : `Opção ${optionLabel(active.id)} não foi reposicionada.`,
    onDragCancel: ({ active }) =>
      `Reordenação da opção ${optionLabel(active.id)} cancelada.`,
  }

  const screenReaderInstructions = {
    draggable:
      'Para reordenar uma opção, pressione Espaço ou Enter. Use as setas para mover, pressione Espaço ou Enter para confirmar, ou Escape para cancelar.',
  }

  return {
    sensors,
    activeId,
    collisionDetection: closestCenter,
    announcements,
    screenReaderInstructions,
    onDragStart: handleDragStart,
    onDragCancel: handleDragCancel,
    onDragEnd: handleDragEnd,
    addOption,
    removeOption,
    moveOption,
    toggleDefault,
    updateLabel: (clientId: string, label: string) =>
      change(
        props.options.map((option) =>
          option.clientId === clientId ? { ...option, label } : { ...option },
        ),
      ),
  }
}
