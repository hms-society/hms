import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentPackage } from '../../components/document-package'
import { ConsultationDocumentEmptyState } from './consultation-documents-empty-state'
import { ConsultationDocumentErrorState } from './consultation-documents-error-state'
import { ConsultationDocumentsLoading } from './consultation-documents-loading'
import { SelectConsultationDocumentsDialog } from './select-consultation-documents-dialog'
import {
  type ConsultationDocumentsPageProps,
  useConsultationDocumentsPage,
} from './use-consultation-documents-page'

export const ConsultationDocumentsPage = ({
  consultationId,
}: ConsultationDocumentsPageProps) => {
  const {
    consultation,
    documents,
    isAttendanceFinalized,
    isReadOnly,
    isPackageConfirmed,
    isPackageConfirming,
    packageConfirmationError,
    packageReopeningError,
    isPackageReopening,
    selection,
    isSelectionLoading,
    isSelectionOpen,
    setIsSelectionOpen,
    isSelectionSaving,
    isLoading,
    isDocumentsBlockedByClosure,
    isError,
    isCancellingDocument,
    handleGenerateDocument,
    handleCancelDocumentGeneration,
    handleRetry,
    handleRefresh,
    handleSaveSelection,
    handleConfirmPackage,
    handleReopenPackage,
  } = useConsultationDocumentsPage({ consultationId })

  if (!isAttendanceFinalized || isDocumentsBlockedByClosure) {
    return (
      <main className='mx-auto flex w-full flex-col'>
        <section className='rounded-xl border border-border bg-card px-4 py-8 text-center shadow-sm sm:px-5'>
          <Icon name='lock' className='mx-auto h-5 w-5 text-muted-foreground' />
          <h1 className='mt-3 font-serif text-lg text-foreground'>
            Documentos bloqueados
          </h1>
          <p className='mx-auto mt-2 max-w-md text-sm text-muted-foreground'>
            {isDocumentsBlockedByClosure
              ? 'Documentos não disponíveis para consultas encerradas sem contratação.'
              : 'Finalize a ficha de atendimento para liberar o pacote de documentos da consulta.'}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className='mx-auto flex w-full flex-col'>
      <DocumentPackage
        title='Documentos da consulta'
        description='Acompanhe a produção, a revisão e o histórico dos documentos vinculados.'
        summary={
          selection
            ? `${selection.selectedDocumentSpecificationIds.length} documentos selecionados`
            : documents.length === 1
              ? '1 documento vinculado'
              : `${documents.length} documentos vinculados`
        }
        items={documents}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          (packageConfirmationError ?? packageReopeningError)?.message ?? undefined
        }
        loadingState={<ConsultationDocumentsLoading />}
        errorState={<ConsultationDocumentErrorState onRetry={handleRetry} />}
        emptyState={<ConsultationDocumentEmptyState />}
        isReadOnly={isReadOnly}
        isConfirmed={isPackageConfirmed}
        isConfirming={isPackageConfirming}
        isReopening={isPackageReopening}
        isConfirmationEligible={documents.every(
          (item) => item.status === 'approved' || item.status === 'rejected',
        )}
        onSelect={() => setIsSelectionOpen(true)}
        onConfirm={handleConfirmPackage}
        onReopen={handleReopenPackage}
        onGenerateDocument={handleGenerateDocument}
        onCancelDocumentGeneration={handleCancelDocumentGeneration}
        isCancellingDocument={isCancellingDocument}
        onRefreshDocument={handleRefresh}
        renderAction={(action, item) => {
          if (!item.latestVersion) return null
          return (
            <Button asChild variant={action === 'review' ? 'brand' : 'ghost'} size='sm'>
              <Anchor
                route='consultationDocumentVersion'
                params={{
                  consultationId,
                  documentId: item.id,
                  documentVersionId: item.latestVersion.id,
                }}
              >
                <Icon name={action === 'review' ? 'pencil' : 'eye'} />
                {action === 'review' ? 'Revisar' : 'Visualizar'}
              </Anchor>
            </Button>
          )
        }}
      />
      <SelectConsultationDocumentsDialog
        open={isSelectionOpen}
        options={selection?.options ?? []}
        selectedDocumentSpecificationIds={
          selection?.selectedDocumentSpecificationIds ?? []
        }
        isLoading={isSelectionLoading}
        isSaving={isSelectionSaving}
        isReadOnly={isReadOnly}
        initialAreaId={consultation?.legalAreaId}
        initialTopicId={consultation?.legalTopicId}
        onOpenChange={setIsSelectionOpen}
        onSave={(ids) => void handleSaveSelection(ids)}
      />
    </main>
  )
}
