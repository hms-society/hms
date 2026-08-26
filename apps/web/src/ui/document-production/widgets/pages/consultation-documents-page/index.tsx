import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import { DocumentVersionStatus } from '@hms/core/document-production/domain/structures'
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
    handleUpdateAccess,
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
          <div className='flex flex-wrap justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsSelectionOpen(true)}
              disabled={isReadOnly}
              title={
                isReadOnly
                  ? 'Consulta encerrada; pacote em modo somente leitura.'
                  : undefined
              }
            >
              <Icon name='list-plus' />
              Selecionar documentos
            </Button>
            {isPackageConfirmed ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isPackageReopening}
                onClick={() => void handleReopenPackage()}
                title='Reabra o pacote para alterar documentos ou gerar novas versões.'
              >
                <Icon name='pencil' />
                {isPackageReopening ? 'Reabrindo...' : 'Editar pacote'}
              </Button>
            ) : (
              <Button
                type='button'
                size='sm'
                disabled={
                  isReadOnly ||
                  isPackageConfirming ||
                  documents.length === 0 ||
                  documents.some(
                    (item) =>
                      item.status !== DocumentVersionStatus.Approved &&
                      item.status !== DocumentVersionStatus.Rejected,
                  )
                }
                onClick={() => void handleConfirmPackage()}
                title={
                  isReadOnly
                    ? 'Consulta encerrada; pacote em modo somente leitura.'
                    : 'Gere e revise todos os documentos para confirmar o pacote.'
                }
              >
                <Icon name='check' />
                {isPackageConfirming ? 'Confirmando...' : 'Confirmar pacote'}
              </Button>
            )}
          </div>
        </header>

        {packageConfirmationError || packageReopeningError ? (
          <p
            className='mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
            role='alert'
          >
            {(packageConfirmationError ?? packageReopeningError)?.message ??
              'Não foi possível atualizar o pacote de documentos.'}
          </p>
        ) : null}

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
              isReadOnly={isReadOnly}
              onUpdateAccess={handleUpdateAccess}
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
        isReadOnly={isReadOnly}
        initialAreaId={consultation?.legalAreaId}
        initialTopicId={consultation?.legalTopicId}
        onOpenChange={setIsSelectionOpen}
        onSave={(ids) => void handleSaveSelection(ids)}
      />
    </main>
  )
}
