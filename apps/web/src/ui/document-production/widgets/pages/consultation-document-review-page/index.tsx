import { DocumentEditor } from '../../components/document-editor'
import { Button } from '@/ui/shadcn/button'
import { ConsultationDocumentReviewErrorState } from './consultation-document-review-error-state'
import { ConsultationDocumentReviewLoading } from './consultation-document-review-loading'
import { CancelManualEditDialog } from './cancel-manual-edit-dialog'
import { DocumentVersionDecisionBar } from './document-version-decision-bar'
import { DocumentVersionHistoryDialog } from './document-version-history-dialog'
import { PendingMarkerNotFoundDialog } from './pending-marker-not-found-dialog'
import { PendingMarkersDialog } from './pending-markers-dialog'
import { RegenerateDocumentVersionDialog } from './regenerate-document-version-dialog'
import { RejectDocumentVersionDialog } from './reject-document-version-dialog'
import { SaveManualVersionDialog } from './save-manual-version-dialog'
import { ViewRejectionReasonDialog } from './view-rejection-reason-dialog'
import { ConsultationDocumentReviewHeader } from './consultation-document-review-header'
import {
  type ConsultationDocumentReviewPageProps,
  useConsultationDocumentReviewPage,
} from './use-consultation-document-review-page'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'

export type { ConsultationDocumentReviewPageProps }

export const ConsultationDocumentReviewPage = (
  props: ConsultationDocumentReviewPageProps,
) => {
  const {
    actionError,
    draft,
    handleApprove,
    handleBack,
    handleCancelGeneration,
    handleConfirmApprove,
    handleConfirmCancel,
    handleConfirmCurrent,
    handleConfirmRegenerate,
    handleConfirmReject,
    handleConfirmSave,
    handleContentChange,
    handleLocateMarker,
    handleRemoveAllPendingMarkers,
    handleRemovePendingMarker,
    handleReject,
    handleRequestCancel,
    handleRequestSave,
    handleRetry,
    handleStartEditing,
    handleVersionNavigation,
    handleViewRejectionReason,
    highlightedTerms,
    isApproveOpen,
    isCancelOpen,
    isCurrentOpen,
    isEditing,
    isError,
    isForbidden,
    isHistoryOpen,
    isLoading,
    isMarkerNotFoundOpen,
    isNotFound,
    isPendingMarkersOpen,
    isRemovingPendingMarker,
    isRegenerateOpen,
    regenerationInstructions,
    isRejectionReasonOpen,
    isRejectOpen,
    isSaveOpen,
    isSaving,
    isSelectingCurrent,
    isSubmittingDecision,
    isRegenerating,
    isCancellingGeneration,
    history,
    pendingMarkers,
    rejectionReason,
    setIsApproveOpen,
    setIsCancelOpen,
    setIsCurrentOpen,
    setIsHistoryOpen,
    setIsMarkerNotFoundOpen,
    setIsPendingMarkersOpen,
    setIsRegenerateOpen,
    setRegenerationInstructions,
    handleRequestRegenerate,
    setIsRejectionReasonOpen,
    setIsRejectOpen,
    setIsSaveOpen,
    setRejectionReason,
    title,
    version,
    viewModel,
  } = useConsultationDocumentReviewPage(props)

  if (isLoading) return <ConsultationDocumentReviewLoading />
  if (isNotFound || isError)
    return (
      <ConsultationDocumentReviewErrorState
        forbidden={isForbidden}
        notFound={isNotFound}
        onBack={() => void handleBack()}
        onRetry={() => void handleRetry()}
      />
    )
  if (!viewModel || !version || !draft)
    return (
      <ConsultationDocumentReviewErrorState
        notFound
        onBack={() => void handleBack()}
        onRetry={() => void handleRetry()}
      />
    )

  return (
    <main className='mx-auto flex w-full flex-col gap-5'>
      <ConsultationDocumentReviewHeader
        viewModel={viewModel}
        pendingMarkersCount={pendingMarkers.length}
        onBack={() => void handleBack()}
        onHistory={() => setIsHistoryOpen(true)}
        onPendingMarkers={() => setIsPendingMarkersOpen(true)}
      />
      {actionError && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
        >
          {actionError}
        </p>
      )}
      <DocumentVersionDecisionBar
        viewModel={viewModel}
        isEditing={isEditing}
        isSaving={isSaving}
        isSubmittingDecision={isSubmittingDecision}
        isSelectingCurrent={isSelectingCurrent}
        isRegenerating={isRegenerating}
        isCancellingGeneration={isCancellingGeneration}
        onEdit={handleStartEditing}
        onCancel={handleRequestCancel}
        onSave={handleRequestSave}
        onApprove={handleApprove}
        onReject={handleReject}
        onSelectCurrent={() => setIsCurrentOpen(true)}
        onRegenerate={handleRequestRegenerate}
        onCancelGeneration={() => void handleCancelGeneration()}
        onViewRejectionReason={handleViewRejectionReason}
      />
      <section
        aria-label='Documento em revisão'
        className='overflow-hidden rounded-xl border bg-card'
      >
        <DocumentEditor
          content={draft}
          onChange={handleContentChange}
          ariaLabel={`Conteúdo da versão ${viewModel.versionNumber}`}
          editable={isEditing}
          highlightedTerms={highlightedTerms}
          emptyState={
            <p className='text-sm text-muted-foreground'>
              Esta versão não possui conteúdo.
            </p>
          }
        />
      </section>
      <DocumentVersionHistoryDialog
        open={isHistoryOpen}
        title={title}
        items={history}
        onOpenChange={setIsHistoryOpen}
        onSelect={handleVersionNavigation}
      />
      <RejectDocumentVersionDialog
        open={isRejectOpen}
        reason={rejectionReason}
        isSubmitting={isSubmittingDecision}
        onOpenChange={setIsRejectOpen}
        onReasonChange={setRejectionReason}
        onConfirm={() => void handleConfirmReject()}
      />
      <SaveManualVersionDialog
        open={isSaveOpen}
        isSaving={isSaving}
        onOpenChange={setIsSaveOpen}
        onConfirm={() => void handleConfirmSave()}
      />
      <CancelManualEditDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={handleConfirmCancel}
      />
      <PendingMarkersDialog
        open={isPendingMarkersOpen}
        markers={pendingMarkers}
        isRemoving={isRemovingPendingMarker}
        onOpenChange={setIsPendingMarkersOpen}
        onLocate={handleLocateMarker}
        onRemove={handleRemovePendingMarker}
        onRemoveAll={handleRemoveAllPendingMarkers}
      />
      <PendingMarkerNotFoundDialog
        open={isMarkerNotFoundOpen}
        onOpenChange={setIsMarkerNotFoundOpen}
      />
      <RegenerateDocumentVersionDialog
        open={isRegenerateOpen}
        isRegenerating={isRegenerating}
        instructions={regenerationInstructions}
        onOpenChange={setIsRegenerateOpen}
        onInstructionsChange={setRegenerationInstructions}
        onConfirm={(instructions) => void handleConfirmRegenerate(instructions)}
      />
      <ViewRejectionReasonDialog
        open={isRejectionReasonOpen}
        reason={viewModel.rejectionReason ?? ''}
        onOpenChange={setIsRejectionReasonOpen}
      />
      <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar versão?</AlertDialogTitle>
            <AlertDialogDescription>
              A aprovação finaliza somente esta versão e a mantém disponível no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingDecision}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingDecision}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmApprove()
              }}
            >
              {isSubmittingDecision ? 'Aprovando…' : 'Aprovar versão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isCurrentOpen} onOpenChange={setIsCurrentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar versão vigente?</AlertDialogTitle>
            <AlertDialogDescription>
              Somente esta versão aprovada será marcada como vigente para a consulta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSelectingCurrent}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSelectingCurrent}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmCurrent()
              }}
            >
              {isSelectingCurrent ? 'Atualizando…' : 'Tornar vigente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        type='button'
        variant='ghost'
        className='sr-only'
        tabIndex={-1}
        aria-hidden='true'
      >
        Estado de revisão
      </Button>
    </main>
  )
}
