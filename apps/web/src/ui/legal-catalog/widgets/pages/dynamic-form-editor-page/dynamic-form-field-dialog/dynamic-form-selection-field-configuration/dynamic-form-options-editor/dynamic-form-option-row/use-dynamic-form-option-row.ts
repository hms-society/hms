import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { DynamicFormOptionRowProps } from './types'

export function useDynamicFormOptionRow({
  option,
  index,
  count,
  onLabelChange,
  onToggleDefault,
  onMove,
  onRemove,
}: DynamicFormOptionRowProps) {
  const sortable = useSortable({ id: option.clientId })

  function handleMoveUp() {
    onMove(index - 1)
  }

  function handleMoveDown() {
    onMove(index + 1)
  }

  return {
    ...sortable,
    style: {
      transform: CSS.Transform.toString(sortable.transform),
      transition: sortable.transition,
    },
    isFirst: index === 0,
    isLast: index === count - 1,
    moveUp: handleMoveUp,
    moveDown: handleMoveDown,
    remove: onRemove,
    toggleDefault: onToggleDefault,
    updateLabel: onLabelChange,
  }
}
