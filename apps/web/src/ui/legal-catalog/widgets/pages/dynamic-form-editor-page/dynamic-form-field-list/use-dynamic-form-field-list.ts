import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'

import type { DynamicFormFieldListProps } from './types'

export function useDynamicFormFieldList({ fields, onMove }: DynamicFormFieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  function onDragStart(event: { active: { id: string | number } }) {
    setActiveId(String(event.active.id))
  }
  function onDragCancel() {
    setActiveId(null)
  }
  function onDragEnd(event: DragEndEvent) {
    setActiveId(null)
    if (!event.over || event.active.id === event.over.id) return
    const from = fields.findIndex((field) => field.clientId === event.active.id)
    const target = fields.findIndex((field) => field.clientId === event.over?.id)
    if (from >= 0 && target >= 0) onMove(String(event.active.id), target)
  }
  function fieldLabel(id: string | number) {
    return fields.find((field) => field.clientId === String(id))?.label || 'sem nome'
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Campo ${fieldLabel(active.id)} selecionado. Use as setas para mover e Espaço para soltar.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Campo ${fieldLabel(active.id)} sobre o campo ${fieldLabel(over.id)}.`
        : `Campo ${fieldLabel(active.id)} fora da lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Campo ${fieldLabel(active.id)} colocado na posição de ${fieldLabel(over.id)}.`
        : `Campo ${fieldLabel(active.id)} não foi reposicionado.`,
    onDragCancel: ({ active }) =>
      `Reordenação do campo ${fieldLabel(active.id)} cancelada.`,
  }
  const screenReaderInstructions = {
    draggable:
      'Para reordenar um campo, pressione Espaço ou Enter. Use as setas para mover, pressione Espaço ou Enter para confirmar, ou Escape para cancelar.',
  }
  return {
    sensors,
    activeId,
    collisionDetection: closestCenter,
    onDragStart,
    onDragCancel,
    onDragEnd,
    announcements,
    screenReaderInstructions,
  }
}

export { DndContext }
