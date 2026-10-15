import type { ChecklistItem } from '../../types'

export function useChecklistItemStatus(item: ChecklistItem, pendingCount: number) {
  const CHECKLIST_ITEM_STATUS = {
    validado: { label: 'Validado', variant: 'success' },
    nao_solicitado: { label: 'Não solicitado', variant: 'secondary' },
  } as const
  function getPendingBadgeProps(item: ChecklistItem, pendingCount: number) {
    return {
      count: item.pendencies || pendingCount,
      singular: Boolean(item.pendencies),
    }
  }

  function getChecklistItemBadge(item: ChecklistItem) {
    return getFixedChecklistItemBadge(item) ?? getRequestedChecklistItemBadge(item)
  }

  function getFixedChecklistItemBadge(item: ChecklistItem) {
    return CHECKLIST_ITEM_STATUS[item.status as keyof typeof CHECKLIST_ITEM_STATUS]
  }

  function getRequestedChecklistItemBadge(item: ChecklistItem) {
    if (item.status !== 'solicitado' || !item.documentFileId) return undefined
    return {
      label: item.statusLabel ?? 'Aguardando validação',
      variant: 'attention' as const,
    }
  }
  return {
    badge: getChecklistItemBadge(item),
    pendingBadgeProps: getPendingBadgeProps(item, pendingCount),
  }
}
