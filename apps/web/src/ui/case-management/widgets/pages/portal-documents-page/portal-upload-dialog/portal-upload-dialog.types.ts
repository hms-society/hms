import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'

export type PortalUploadDialogProps = {
  item: CaseChecklistItem | null
  open: boolean
  isUploading: boolean
  protocol?: string
  error?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (file: File) => Promise<void>
}
