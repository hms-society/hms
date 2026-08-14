import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import { ConsultationDocumentEmptyState } from './consultation-documents-empty-state'
import { ConsultationDocumentErrorState } from './consultation-documents-error-state'
import { ConsultationDocumentList } from './consultation-document-list'
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
    documents,
    selection,
    isSelectionLoading,
    isSelectionOpen,
    setIsSelectionOpen,
    isSelectionSaving,
    isLoading,
    isError,
    isCancellingDocument,
    handleGenerateDocument,
    handleCancelDocumentGeneration,
    handleRetry,
    handleRefresh,
    handleSaveSelection,
  } = useConsultationDocumentsPage({ consultationId })

  return (
    <main className='mx-auto flex w-full flex-col'>
      <section className='rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5'>
        <header className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0 space-y-1'>
            <PageTitle className='text-base font-semibold'>
              Documentos da consulta
            </PageTitle>
            <p className='max-w-2xl text-xs leading-5 text-muted-foreground'>
              Acompanhe a produção, a revisão e o histórico dos documentos vinculados.
            </p>
          </div>
          <div className='flex flex-wrap justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsSelectionOpen(true)}
            >
              <Icon name='list-plus' />
              Selecionar documentos
            </Button>
          </div>
        </header>

        <div className='mt-4 flex items-center justify-between border-b border-border pb-2 text-[0.6875rem] text-muted-foreground'>
          <span>
            {selection
              ? `${selection.selectedDocumentSpecificationIds.length} documentos selecionados`
              : documents.length === 1
                ? '1 documento vinculado'
                : `${documents.length} documentos vinculados`}
          </span>
          <span>Produção documental</span>
        </div>

        <div className='pt-1'>
          {isLoading ? (
            <ConsultationDocumentsLoading />
          ) : isError ? (
            <ConsultationDocumentErrorState onRetry={handleRetry} />
          ) : documents.length === 0 ? (
            <ConsultationDocumentEmptyState />
          ) : (
            <ConsultationDocumentList
              items={documents}
              onGenerateDocument={handleGenerateDocument}
              onCancelDocumentGeneration={handleCancelDocumentGeneration}
              isCancellingDocument={isCancellingDocument}
              onRefreshDocument={handleRefresh}
            />
          )}
        </div>
      </section>
      <SelectConsultationDocumentsDialog
        open={isSelectionOpen}
        options={selection?.options ?? []}
        selectedDocumentSpecificationIds={
          selection?.selectedDocumentSpecificationIds ?? []
        }
        isLoading={isSelectionLoading}
        isSaving={isSelectionSaving}
        onOpenChange={setIsSelectionOpen}
        onSave={(ids) => void handleSaveSelection(ids)}
      />
    </main>
  )
}
