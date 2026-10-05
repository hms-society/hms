import type { DocumentPendingMarker } from '@hms/core/document-production/domain/structures'

export type PendingMarkersDialogProps = {
  open: boolean
  markers: readonly DocumentPendingMarker[]
  isRemoving: boolean
  onOpenChange: (open: boolean) => void
  onLocate: (marker: string) => void
  onFill: (marker: string, value: string) => void
  onRemove: (marker: string) => void
  onRemoveAll: () => void
}
