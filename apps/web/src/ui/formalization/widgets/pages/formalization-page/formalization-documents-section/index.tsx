import {
  DocumentPackage,
  type DocumentPackageItem,
} from '@/ui/document-production/widgets/components/document-package'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { DocumentPackageConfirmationDialog } from '../document-package-confirmation-dialog'
import { SelectFormalizationDocumentsDialog } from '../select-formalization-documents-dialog'
import {
  type FormalizationDocumentsSectionProps,
  useFormalizationDocumentsSection,
} from './use-formalization-documents-section'

export type { FormalizationDocumentsSectionProps }

export const FormalizationDocumentsSection = (
  props: FormalizationDocumentsSectionProps,
) => {
  const {
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
    initialAreaId,
    initialTopicId,
    isConfirmationDialogOpen,
    isReadOnly,
    isSelectionOpen,
    items,
    selection,
    shouldRender,
  } = useFormalizationDocumentsSection(props)
  const { production } = props

  if (!shouldRender) return null

  return (
    <>
      <DocumentPackage
        title='Documentos da formalização'
        description='Acompanhe a produção, a revisão e o histórico dos documentos vinculados.'
        summary={
          selection
            ? `${selection.selectedDocumentSpecificationIds.length} documentos selecionados`
            : `${items.length} documentos vinculados`
        }
        items={items}
        isLoading={
          production.documentsQuery.isLoading || production.selectionQuery.isLoading
        }
        isError={production.documentsQuery.isError || production.selectionQuery.isError}
        errorMessage={actionError?.message}
        isReadOnly={isReadOnly}
        isConfirmed={production.isPackageConfirmed}
        isReopening={production.isReopeningPackage}
        isConfirming={production.confirmMutation.isPending}
        isConfirmationEligible={production.isConfirmationEligible}
        onSelect={() => handleOpenChange(true)}
        onConfirm={!production.isPackageConfirmed ? handleConfirmRequest : undefined}
        onReopen={production.isPackageConfirmed ? handleReopen : undefined}
        onRetry={handleRetry}
        onGenerateDocument={handleGenerateDocument}
        onCancelDocumentGeneration={handleCancelDocumentGeneration}
        isCancellingDocument={production.isCancellingDocument}
        onRefreshDocument={handleRefreshDocument}
        renderAction={(action, item: DocumentPackageItem) => {
          const versionId = item.latestVersion?.id
          if (!versionId) return null
          const isReviewAction = action === 'review'
          return (
            <Button
              variant={isReviewAction ? 'default' : 'outline'}
              size='sm'
              className={
                isReviewAction
                  ? undefined
                  : 'rounded-full border-primary/40 px-3 text-primary hover:border-primary hover:bg-secondary hover:text-primary'
              }
              onClick={() => void handleOpenDocumentVersion(versionId)}
            >
              {!isReviewAction && <Icon name='eye' className='size-3.5' />}
              {isReviewAction ? 'Revisar' : 'Visualizar'}
            </Button>
          )
        }}
      />
      <SelectFormalizationDocumentsDialog
        open={isSelectionOpen}
        options={selection?.options ?? []}
        selectedDocumentSpecificationIds={
          selection?.selectedDocumentSpecificationIds ?? []
        }
        isLoading={production.selectionQuery.isLoading}
        isSaving={production.selectionMutation.isPending}
        isReadOnly={isReadOnly}
        initialAreaId={initialAreaId}
        initialTopicId={initialTopicId}
        onOpenChange={handleOpenChange}
        onSave={(ids) => void handleSaveSelection(ids)}
      />
      <DocumentPackageConfirmationDialog
        open={isConfirmationDialogOpen}
        isPending={production.confirmMutation.isPending}
        documentsCount={items.length}
        onOpenChange={handleConfirmationDialogChange}
        onConfirm={handleConfirm}
      />
    </>
  )
}
