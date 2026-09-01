import { DocumentEditor } from '@/ui/document-production/widgets/components/document-editor'
import {
  DocumentReviewDecisionBar,
  DocumentReviewHeader,
} from '@/ui/document-production/widgets/components/document-review'
import { Button } from '@/ui/shadcn/button'
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
import { useFormalizationDocumentReviewPage } from './use-formalization-document-review-page'
import { CancelManualEditDialog } from '@/ui/document-production/widgets/pages/consultation-document-review-page/cancel-manual-edit-dialog'
import { DocumentVersionHistoryDialog } from '@/ui/document-production/widgets/pages/consultation-document-review-page/document-version-history-dialog'
import { RejectDocumentVersionDialog } from '@/ui/document-production/widgets/pages/consultation-document-review-page/reject-document-version-dialog'
import { SaveManualVersionDialog } from '@/ui/document-production/widgets/pages/consultation-document-review-page/save-manual-version-dialog'
import { RegenerateDocumentVersionDialog } from '@/ui/document-production/widgets/pages/consultation-document-review-page/regenerate-document-version-dialog'

export type { FormalizationDocumentReviewPageProps } from './use-formalization-document-review-page'

export const FormalizationDocumentReviewPage = (
  props: import('./use-formalization-document-review-page').FormalizationDocumentReviewPageProps,
) => {
  const review = useFormalizationDocumentReviewPage(props)

  if (review.isLoading) {
    return (
      <main className='p-6' aria-busy='true'>
        Carregando versão…
      </main>
    )
  }

  if (review.isError || !review.viewModel || !review.version || !review.draft) {
    return (
      <main className='flex flex-col gap-3 p-6' role='alert'>
        <h1 className='font-serif text-2xl'>Não foi possível carregar esta versão.</h1>
        <p className='text-sm text-muted-foreground'>
          Verifique o acesso e tente novamente.
        </p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => void review.handleBack().catch(() => undefined)}
          >
            Voltar aos documentos
          </Button>
          <Button onClick={() => void review.handleRetry().catch(() => undefined)}>
            Tentar novamente
          </Button>
        </div>
      </main>
    )
  }

  const { viewModel, version, draft } = review

  return (
    <main className='flex w-full flex-col gap-5 pb-10'>
      <DocumentReviewHeader
        viewModel={viewModel}
        pendingMarkersCount={version.pendingMarkers.length}
        onBack={() => void review.handleBack().catch(() => undefined)}
        onHistory={() => review.setIsHistoryOpen(true)}
        onPendingMarkers={() => undefined}
      />
      {review.actionError && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
        >
          {review.actionError}
        </p>
      )}
      <DocumentReviewDecisionBar
        viewModel={viewModel}
        isEditing={review.isEditing}
        isSaving={review.isSaving}
        isSubmittingDecision={review.isSubmittingDecision}
        isSelectingCurrent={review.isSelectingCurrent}
        isRegenerating={review.isRegenerating}
        isCancellingGeneration={false}
        isReadOnly={review.isReadOnly}
        onEdit={() => {
          if (review.isReadOnly) return
          review.setActionError(undefined)
          review.setIsEditing(true)
        }}
        onCancel={() => {
          if (review.isDirty) review.setIsCancelOpen(true)
          else review.setIsEditing(false)
        }}
        onSave={() => review.setIsSaveOpen(true)}
        onApprove={() => review.setIsApproveOpen(true)}
        onReject={() => {
          review.setRejectionReason('')
          review.setIsRejectOpen(true)
        }}
        onSelectCurrent={() => review.setIsCurrentOpen(true)}
        onRegenerate={() => {
          review.setRegenerationInstructions('')
          review.setIsRegenerateOpen(true)
        }}
        onCancelGeneration={() => undefined}
        onViewRejectionReason={() => undefined}
      />
      <section
        aria-label='Documento em revisão'
        className='overflow-hidden rounded-xl border bg-card'
      >
        <DocumentEditor
          content={draft}
          onChange={review.setDraft}
          ariaLabel={`Conteúdo da versão ${viewModel.versionNumber}`}
          editable={review.isEditing}
          emptyState={
            <p className='text-sm text-muted-foreground'>
              Esta versão não possui conteúdo.
            </p>
          }
        />
      </section>
      <DocumentVersionHistoryDialog
        open={review.isHistoryOpen}
        title={viewModel.title}
        items={review.history}
        onOpenChange={review.setIsHistoryOpen}
        onSelect={(versionId) => {
          if (versionId === props.documentVersionId) {
            review.setIsHistoryOpen(false)
            return
          }
          if (!review.isDirty) {
            void review.handleVersionNavigation(versionId).catch(() => undefined)
          }
        }}
      />
      <CancelManualEditDialog
        open={review.isCancelOpen}
        onOpenChange={review.setIsCancelOpen}
        onConfirm={() => {
          review.setDraft(JSON.parse(JSON.stringify(version.content)))
          review.setIsEditing(false)
          review.setIsCancelOpen(false)
        }}
      />
      <SaveManualVersionDialog
        open={review.isSaveOpen}
        isSaving={review.isSaving}
        onOpenChange={review.setIsSaveOpen}
        onConfirm={() => void review.handleConfirmSave()}
      />
      <RejectDocumentVersionDialog
        open={review.isRejectOpen}
        reason={review.rejectionReason}
        isSubmitting={review.isSubmittingDecision}
        onOpenChange={review.setIsRejectOpen}
        onReasonChange={review.setRejectionReason}
        onConfirm={() =>
          void review.handleReview({
            status: 'rejected',
            rejectionReason: review.rejectionReason.trim(),
          })
        }
      />
      <RegenerateDocumentVersionDialog
        open={review.isRegenerateOpen}
        isRegenerating={review.isRegenerating}
        instructions={review.regenerationInstructions}
        onOpenChange={review.setIsRegenerateOpen}
        onInstructionsChange={review.setRegenerationInstructions}
        onConfirm={() => void review.handleConfirmRegenerate()}
      />
      <AlertDialog open={review.isApproveOpen} onOpenChange={review.setIsApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar versão?</AlertDialogTitle>
            <AlertDialogDescription>
              A aprovação finaliza somente esta versão e a mantém disponível no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={review.isSubmittingDecision}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={review.isSubmittingDecision}
              onClick={(event) => {
                event.preventDefault()
                void review.handleReview({ status: 'approved' })
              }}
            >
              {review.isSubmittingDecision ? 'Aprovando…' : 'Aprovar versão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={review.isCurrentOpen} onOpenChange={review.setIsCurrentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar versão vigente?</AlertDialogTitle>
            <AlertDialogDescription>
              Somente esta versão será marcada como vigente para o documento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={review.isSelectingCurrent}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={review.isSelectingCurrent}
              onClick={(event) => {
                event.preventDefault()
                void review.handleConfirmCurrent()
              }}
            >
              {review.isSelectingCurrent ? 'Atualizando…' : 'Tornar vigente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
