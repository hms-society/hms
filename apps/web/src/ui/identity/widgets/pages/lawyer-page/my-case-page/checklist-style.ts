import type { IconName } from '@/ui/shared/widgets/components/icon'

import type { ChecklistItemStatus } from './types'

export function getChecklistIcon(itemStatus: ChecklistItemStatus): IconName {
  if (itemStatus === 'validado') return 'check'
  if (itemStatus === 'solicitado') return 'clock'
  return 'file-minus'
}

export function getChecklistIconClasses(itemStatus: ChecklistItemStatus) {
  if (itemStatus === 'validado') {
    return 'bg-primary text-primary-foreground'
  }

  if (itemStatus === 'solicitado') {
    return 'border border-amber-500/40 bg-amber-500/10 text-amber-700'
  }

  return 'bg-muted text-muted-foreground'
}

export function getChecklistRowClasses(itemStatus: ChecklistItemStatus) {
  if (itemStatus === 'validado') return 'border-primary/10 bg-highlight'
  return 'border-border bg-card'
}

export function getChecklistActionLabel(
  itemStatus: ChecklistItemStatus,
  hasDocument = false,
) {
  if (itemStatus === 'validado') return 'Ver documento'
  if (itemStatus === 'solicitado' && hasDocument) return 'Ver documento'
  if (itemStatus === 'solicitado') return 'Aguardando documento'
  return 'Solicitar'
}

export function getChecklistActionIcon(
  itemStatus: ChecklistItemStatus,
  hasDocument = false,
): IconName {
  if (itemStatus === 'validado') return 'eye'
  if (itemStatus === 'solicitado' && hasDocument) return 'eye'
  if (itemStatus === 'solicitado') return 'clock'
  return 'plus'
}
