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
  isReadOnly: boolean
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
  isReadOnly,
  removeSignatoryError,
}: SignatoryCardProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const isPending = isReplacingSignatoryDocuments || isSelectingSignatoryChannel

  function handleToggleDocument(documentId: string) {
    if (isReadOnly) return
    onSelectedDocumentsChange(
      selectedDocuments.includes(documentId)
        ? selectedDocuments.filter((id) => id !== documentId)
        : [...selectedDocuments, documentId],
    )
  }

  function handleSelectChannel(channel: CommunicationChannel, selected: boolean) {
    if (isReadOnly) return
    onSelectChannel(channel, selected)
  }

  function handleRemoveDialogOpenChange(open: boolean) {
    if (isReadOnly) return
    setRemoveDialogOpen(open)
  }

  async function handleConfirmRemove() {
    if (isReadOnly) return
    await onRemoveSignatory()
    setRemoveDialogOpen(false)
  }

  return {
    handleConfirmRemove,
    handleRemoveDialogOpenChange,
    handleToggleDocument,
    onSelectChannel: handleSelectChannel,
    isPending,
    isRemovingSignatory,
    removeSignatoryError,
    removeDialogOpen,
  }
}
