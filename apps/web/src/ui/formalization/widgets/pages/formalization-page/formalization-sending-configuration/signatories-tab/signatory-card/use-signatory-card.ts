import { useState } from 'react'
import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureSignatoryView,
} from '@hms/core/formalization/domain/structures'
import type { CommunicationChannel } from '@hms/core/communication/domain/structures'

export type SignatoryCardProps = {
  signatory: FormalizationSignatureSignatoryView
  documents: FormalizationSignatureConfiguration['documents']
  selectedDocuments: readonly string[]
  onSelectedDocumentsChange: (documentIds: readonly string[]) => void
  onSelectChannel: (channel: CommunicationChannel, selected: boolean) => void
  onRemoveSignatory: () => Promise<void>
  isRemovingSignatory: boolean
  isReplacingSignatoryDocuments: boolean
  isSelectingSignatoryChannel: boolean
  removeSignatoryError: unknown
}

export function useSignatoryCard({
  selectedDocuments,
  onSelectedDocumentsChange,
  onSelectChannel,
  onRemoveSignatory,
  isRemovingSignatory,
  isReplacingSignatoryDocuments,
  isSelectingSignatoryChannel,
  removeSignatoryError,
}: SignatoryCardProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const isPending = isReplacingSignatoryDocuments || isSelectingSignatoryChannel

  function handleToggleDocument(documentId: string) {
    onSelectedDocumentsChange(
      selectedDocuments.includes(documentId)
        ? selectedDocuments.filter((id) => id !== documentId)
        : [...selectedDocuments, documentId],
    )
  }

  function handleRemoveDialogOpenChange(open: boolean) {
    setRemoveDialogOpen(open)
  }

  async function handleConfirmRemove() {
    await onRemoveSignatory()
    setRemoveDialogOpen(false)
  }

  return {
    handleConfirmRemove,
    handleRemoveDialogOpenChange,
    handleToggleDocument,
    onSelectChannel,
    isPending,
    isRemovingSignatory,
    removeSignatoryError,
    removeDialogOpen,
  }
}
