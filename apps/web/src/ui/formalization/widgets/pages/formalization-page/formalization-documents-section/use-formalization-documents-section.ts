import { useState } from 'react'

import type { DocumentPackageItem } from '@/ui/document-production/widgets/components/document-package'
import type { FormalizationDocumentProductionController } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type FormalizationDocumentsSectionProps = {
  formalizationId: string
  formalization: {
    contractFormState: string
    legalAreaId?: string | null
    legalTopicId?: string | null
    version: number
  }
  intake: {
    legalAreaId?: string | null
    legalTopicId?: string | null
  }
  isTerminal: boolean
  production: FormalizationDocumentProductionController
}

export function useFormalizationDocumentsSection({
  formalizationId,
  formalization,
  intake,
  isTerminal,
  production,
}: FormalizationDocumentsSectionProps) {
  const { navigateTo } = useNavigation()
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const selection = production.selectionQuery.data
  const items: readonly DocumentPackageItem[] = production.documents
  const isReadOnly = isTerminal || production.isPackageConfirmed
  const actionError =
    production.documentsQuery.error ??
    production.selectionQuery.error ??
    production.generationMutation.error ??
    production.cancellationMutation.error ??
    production.selectionMutation.error ??
    production.confirmMutation.error

  async function handleConfirmRequest() {
    setIsConfirmationDialogOpen(true)
  }

  async function handleSaveSelection(documentSpecificationIds: readonly string[]) {
    try {
      await production.selectionMutation.mutateAsync(documentSpecificationIds)
      setIsSelectionOpen(false)
    } catch {
      // The mutation error is rendered in the package; keep the dialog open for retry.
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsSelectionOpen(nextOpen)
  }

  function handleConfirmationDialogChange(nextOpen: boolean) {
    setIsConfirmationDialogOpen(nextOpen)
  }

  function handleConfirm() {
    const expectedVersion = formalization.version
    production.confirmMutation.mutate(expectedVersion)
  }

  function handleReopen() {
    return production.reopenPackage(formalization.version)
  }

  function handleRetry() {
    return production.documentsQuery.refetch()
  }

  function handleGenerateDocument(documentId: string) {
    return production.handleGenerateDocument(documentId).catch(() => undefined)
  }

  function handleCancelDocumentGeneration(documentId: string) {
    return production.cancellationMutation.mutateAsync(documentId).catch(() => undefined)
  }

  function handleRefreshDocument() {
    return production.documentsQuery.refetch()
  }

  function handleOpenDocumentVersion(documentVersionId: string) {
    return navigateTo('formalizationDocumentVersion', {
      params: { formalizationId, documentVersionId },
    }).catch(() => undefined)
  }

  return {
    actionError,
    handleCancelDocumentGeneration,
    handleConfirmationDialogChange,
    handleConfirm,
    handleConfirmRequest,
    handleGenerateDocument,
    handleOpenChange,
    handleOpenDocumentVersion,
    handleRefreshDocument,
    handleRetry,
    handleReopen,
    handleSaveSelection,
    initialAreaId: formalization.legalAreaId ?? intake.legalAreaId ?? undefined,
    initialTopicId: formalization.legalTopicId ?? intake.legalTopicId ?? undefined,
    isConfirmationDialogOpen,
    isReadOnly,
    isSelectionOpen,
    items,
    selection,
    shouldRender: formalization.contractFormState === 'closed',
  }
}
