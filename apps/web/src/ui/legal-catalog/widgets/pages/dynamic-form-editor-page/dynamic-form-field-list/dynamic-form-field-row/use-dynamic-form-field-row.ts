import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { DynamicFormFieldRowProps } from './types'

export function useDynamicFormFieldRow({
  field,
  index,
  count,
  onEdit,
  onRemove,
  onMove,
}: DynamicFormFieldRowProps) {
  const sortable = useSortable({ id: field.clientId })
  return {
    ...sortable,
    style: {
      transform: CSS.Transform.toString(sortable.transform),
      transition: sortable.transition,
    },
    setActivatorNodeRef: sortable.setActivatorNodeRef,
    isFirst: index === 0,
    isLast: index === count - 1,
    handleEdit: onEdit,
    handleRemove: onRemove,
    moveUp: () => onMove(index - 1),
    moveDown: () => onMove(index + 1),
  }
}
