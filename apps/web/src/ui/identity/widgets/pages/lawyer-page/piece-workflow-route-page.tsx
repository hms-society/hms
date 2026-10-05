import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
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
import { DocumentEditor } from '@/ui/document-production/widgets/components/document-editor'
import { PendingVariableValuesDialog } from './pending-variable-values-dialog'
import { PieceFilePreview } from './piece-file-preview'
import { VersionHistory } from './version-history'
import { ReviewActionDialog } from './my-case-page/case-pieces-tab/piece-workflow-dialog'
import { ElaborateDocumentVersionDialog } from './elaborate-document-version-dialog'
import {
  type PieceWorkflowRoutePageMode,
  usePieceWorkflowRoutePage,
} from './use-piece-workflow-route-page'

type PieceWorkflowRoutePageProps = {
  mode: PieceWorkflowRoutePageMode
  caseId: string
  documentId: string
  adjustmentsRequested?: boolean
}

const reviewFindings = [
  {
    title: 'Tempo de contribuição divergente',
    detail: 'Conferir o período informado na peça com o CNIS mais recente.',
    category: 'Divergência',
  },
  {
    title: 'Pedido subsidiário ausente',
    detail: 'Verificar se cabe pedido subsidiário de reafirmação da DER.',
    category: 'Lacuna',
  },
  {
    title: 'Número do benefício anterior',
    detail: 'Confirmar se existe benefício anterior registrado no dossiê.',
    category: 'Dado faltante',
  },
]

export function PieceWorkflowRoutePage({
  mode,
  caseId,
  documentId,
  adjustmentsRequested = false,
}: PieceWorkflowRoutePageProps) {
  const {
    document,
    documentError,
    editedContent,
    editorActions,
    casePublicCode,
    isDocumentError,
    isLoadingDocument,
    isReadOnlyVersion,
    isDiscardEditsDialogOpen,
    isAuthor,
    isCheckingReviewer,
    isPendingVariableDialogOpen,
    isVersionDialogOpen,
    isGeneratingRevision,
    versionActionError,
    isReviewConfirmed,
    reviewAction,
    pendingVariables,
    currentVersion,
    saveState,
    version,
    handleBackToCase,
    handleChangeContent,
    handleSelectVersion,
    handleCancelDiscardEdits,
    handleConfirmDiscardEdits,
    handleEditorReady,
    handleOpenPendingVariableDialog,
    handlePendingVariableDialogOpenChange,
    handleApplyPendingVariableValues,
    handleCloseReviewAction,
    handleConfirmReviewAction,
    handleOpenReview,
    handleOpenReviewAction,
    handleReviewConfirmationChange,
    handleOpenVersionDialog,
    handleVersionDialogOpenChange,
    handleStartManualVersion,
    handleGenerateRevision,
    handleSaveNewVersion,
  } = usePieceWorkflowRoutePage({ mode, caseId, documentId })

  if (isLoadingDocument) {
    return (
      <div className='flex min-h-screen items-center justify-center text-muted-foreground'>
        Carregando documento...
      </div>
    )
  }

  if (isDocumentError || !document || !version) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center'>
        <p className='text-sm text-destructive'>
          {documentError instanceof Error
            ? documentError.message
            : 'Não foi possível carregar esta peça.'}
        </p>
        <Button variant='outline' onClick={handleBackToCase}>
          Voltar ao caso
        </Button>
      </main>
    )
  }

  const isReview = mode === 'review'
  const currentContent = editedContent ?? version.content

  return (
    <main className='flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-background'>
      <header className='flex min-w-0 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <Button variant='outline' size='sm' onClick={handleBackToCase}>
            <Icon name='arrow-left' /> Voltar ao caso
          </Button>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-xs text-muted-foreground'>
              {casePublicCode ?? '…'} <span aria-hidden='true'>›</span> Peças{' '}
              <span aria-hidden='true'>›</span> {isReview ? 'Revisão técnica' : 'Editor'}
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='truncate font-serif text-lg font-semibold'>
                {document.title}
              </h1>
              <Badge variant={isReview ? 'info' : 'attention'}>
                {isReview
                  ? `Em revisão · v${version.versionNumber}`
                  : isReadOnlyVersion
                    ? `Somente leitura · v${version.versionNumber}`
                    : adjustmentsRequested
                      ? `Ajustes solicitados · v${version.versionNumber}`
                      : `Em elaboração · v${version.versionNumber}`}
              </Badge>
            </div>
          </div>
        </div>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          {isReview ? (
            <span className='text-xs text-muted-foreground'>
              <Icon name='eye' className='mr-1 inline size-3.5' /> Modo leitura
            </span>
          ) : (
            <>
              <span className='text-xs text-muted-foreground' role='status'>
                {saveState === 'saving'
                  ? 'Salvando…'
                  : saveState === 'error'
                    ? 'Falha ao salvar'
                    : editedContent
                      ? 'Alterações não salvas'
                      : 'Versão carregada'}
              </span>
              <Button variant='outline' size='sm' onClick={handleOpenVersionDialog}>
                <Icon name='history' /> Versões
              </Button>
              {editedContent ? (
                <Button
                  variant='outline'
                  size='sm'
                  disabled={saveState === 'saving'}
                  onClick={handleSaveNewVersion}
                >
                  {saveState === 'saving' ? (
                    <Icon name='refresh-cw' className='animate-spin' />
                  ) : (
                    <Icon name='check' />
                  )}
                  {saveState === 'saving' ? 'Salvando versão…' : 'Salvar nova versão'}
                </Button>
              ) : null}
              {!isReadOnlyVersion ? (
                <Button
                  size='sm'
                  disabled={saveState !== 'saved'}
                  onClick={handleOpenReview}
                >
                  <Icon name='eye' />
                  {adjustmentsRequested
                    ? 'Resubmeter para revisão'
                    : 'Submeter para revisão'}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </header>

      {isReview ? (
        <section className='grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_minmax(280px,320px)]'>
          <div className='min-w-0'>
            <VersionHistory
              versions={document.versions}
              currentVersionId={currentVersion?.id ?? version.id}
              selectedVersionId={version.id}
            />
          </div>
          <div className='min-w-0 overflow-y-auto bg-muted/50 p-4 sm:p-6'>
            <div className='mx-auto max-w-[900px] overflow-hidden rounded-lg border bg-card shadow-sm'>
              {version.content ? (
                <DocumentEditor
                  content={version.content}
                  onChange={() => undefined}
                  editable={false}
                  ariaLabel='Conteúdo da peça em revisão'
                />
              ) : (
                <PieceFilePreview
                  caseId={caseId}
                  documentId={documentId}
                  versionId={version.id}
                  storagePath={version.storagePath}
                  versionNumber={version.versionNumber}
                />
              )}
            </div>
          </div>
          <aside className='flex min-w-0 flex-col gap-4 border-t bg-card p-4 xl:border-l xl:border-t-0'>
            <section>
              <h2 className='font-serif font-semibold'>Alertas de revisão</h2>
              <p className='mt-1 text-xs text-muted-foreground'>
                Apontamentos para conferência. A decisão é do revisor.
              </p>
              <div className='mt-3 space-y-2'>
                {reviewFindings.map((finding, index) => (
                  <article
                    key={finding.title}
                    className='rounded-md border bg-muted/30 p-3'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <h3 className='text-sm font-medium'>
                        {index + 1}. {finding.title}
                      </h3>
                      <Badge variant='attention'>{finding.category}</Badge>
                    </div>
                    <p className='mt-2 text-xs text-muted-foreground'>{finding.detail}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className='border-t pt-4'>
              <h2 className='font-serif font-semibold'>Revisões dos membros</h2>
              <p className='mt-2 rounded-md border bg-muted/30 p-3 text-xs'>
                Comentários e histórico de revisão serão exibidos aqui quando disponíveis
                para esta versão.
              </p>
            </section>
            <div className='mt-auto space-y-2 border-t pt-4'>
              {isAuthor ? (
                <p
                  role='alert'
                  className='rounded-md border border-attention bg-attention/20 p-3 text-xs'
                >
                  Quem elaborou esta versão não pode revisá-la. Outro membro da equipe
                  deve assumir a revisão técnica.
                </p>
              ) : null}
              <label
                htmlFor='review-responsibility-confirmation'
                className='flex items-start gap-2 rounded-md border border-primary/50 bg-primary/10 p-3 text-xs'
              >
                <Checkbox
                  id='review-responsibility-confirmation'
                  checked={isReviewConfirmed}
                  onCheckedChange={(checked) =>
                    handleReviewConfirmationChange(checked === true)
                  }
                />
                Confirmo minha responsabilidade técnica sobre o conteúdo desta peça e sua
                aptidão para protocolo ou entrega.
              </label>
              <Button
                className='w-full'
                disabled={!isReviewConfirmed || isAuthor || isCheckingReviewer}
                onClick={() => handleOpenReviewAction('approval')}
              >
                <Icon name='check' /> Aprovar peça
              </Button>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <Button
                  variant='outline'
                  disabled={isAuthor || isCheckingReviewer}
                  onClick={() => handleOpenReviewAction('adjustments')}
                >
                  Solicitar ajustes
                </Button>
                <Button
                  variant='destructive'
                  disabled={isAuthor || isCheckingReviewer}
                  onClick={() => handleOpenReviewAction('block')}
                >
                  Bloqueio
                </Button>
              </div>
            </div>
          </aside>
        </section>
      ) : (
        <section className='grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_minmax(280px,300px)]'>
          <div className='min-w-0'>
            <VersionHistory
              versions={document.versions}
              currentVersionId={currentVersion?.id ?? version.id}
              selectedVersionId={version.id}
              onSelectVersion={handleSelectVersion}
            />
          </div>
          <div className='min-w-0 overflow-y-auto bg-muted/50 p-4 sm:p-6'>
            <div className='mx-auto max-w-[900px] overflow-hidden rounded-lg border bg-card shadow-sm'>
              {currentContent ? (
                <DocumentEditor
                  content={currentContent}
                  onChange={handleChangeContent}
                  editable={!isReadOnlyVersion}
                  onEditorReady={handleEditorReady}
                  ariaLabel='Conteúdo da peça jurídica'
                  highlightedTerms={pendingVariables.map((variable) => variable.marker)}
                  focusFirstHighlightedTerm={false}
                />
              ) : (
                <>
                  <PieceFilePreview
                    caseId={caseId}
                    documentId={documentId}
                    versionId={version.id}
                    storagePath={version.storagePath}
                  />
                  <p className='border-t px-4 py-3 text-xs text-muted-foreground'>
                    Exibindo o arquivo original desta versão. Não há conteúdo editável
                    estruturado disponível para este documento.
                  </p>
                </>
              )}
            </div>
          </div>
          <aside className='border-l bg-card p-4'>
            {adjustmentsRequested ? (
              <div className='mt-3 rounded-md border border-attention bg-attention/20 p-3 text-sm'>
                Ajustes solicitados pela revisão técnica. Faça as correções antes de
                resubmeter a peça.
              </div>
            ) : null}
            <h2 className='font-serif font-semibold'>
              Referências usadas na elaboração desta peça
            </h2>
            <ul className='mt-4 space-y-2 text-sm'>
              {(document.generation?.referenceDocuments ?? []).map((reference) => (
                <li
                  key={reference.id}
                  className='flex items-start gap-2 rounded-md border p-3'
                >
                  <Icon
                    name='file-text'
                    className='mt-0.5 size-4 shrink-0 text-primary'
                  />
                  <span className='min-w-0 break-words'>
                    <span className='block font-medium'>{reference.fileName}</span>
                    {reference.checklistItemLabel ? (
                      <span className='mt-0.5 block text-xs text-muted-foreground'>
                        {reference.checklistItemLabel}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            {!document.generation?.referenceDocuments?.length ? (
              <p className='mt-3 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'>
                Nenhum documento de referência foi registrado para esta geração.
              </p>
            ) : null}
            <section className='mt-5 border-t pt-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h3 className='font-serif font-semibold'>Variáveis pendentes</h3>
                {pendingVariables.length ? (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={!editorActions || isReadOnlyVersion}
                    onClick={handleOpenPendingVariableDialog}
                  >
                    <Icon name='pencil' /> Inserir valores
                  </Button>
                ) : null}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Complete os campos ausentes diretamente no texto ou use o preenchimento em
                lote. Os marcadores destacados ainda precisam de valor.
              </p>
              {pendingVariables.length ? (
                <ul className='mt-3 space-y-2'>
                  {pendingVariables.map((variable) => (
                    <li
                      key={variable.marker}
                      className='rounded-md border bg-muted/30 p-3 text-sm'
                    >
                      <span className='block font-medium'>{variable.label}</span>
                      <span className='mt-1 block text-xs text-muted-foreground'>
                        Não informado nos documentos
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='mt-3 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'>
                  Nenhuma variável pendente nesta versão.
                </p>
              )}
            </section>
            {saveState === 'error' ? (
              <p role='alert' className='mt-3 text-xs text-destructive'>
                Não foi possível salvar as alterações no banco. Tente editar novamente.
              </p>
            ) : null}
            {!isReadOnlyVersion ? (
              <Button
                variant='outline'
                className='mt-5 w-full'
                onClick={handleOpenReview}
              >
                Abrir revisão técnica
              </Button>
            ) : (
              <p className='mt-5 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground'>
                Esta versão está em modo de leitura. Use “Versões” para elaborar uma nova
                versão baseada nela.
              </p>
            )}
          </aside>
        </section>
      )}

      {isReview && reviewAction ? (
        <ReviewActionDialog
          kind={reviewAction}
          open
          documentTitle={document.title}
          casePublicCode={casePublicCode}
          versionNumber={version.versionNumber}
          onConfirm={handleConfirmReviewAction}
          onOpenChange={(open) => !open && handleCloseReviewAction()}
        />
      ) : null}

      {!isReview ? (
        <div className='border-t bg-card px-4 py-3 text-right'>
          <Button variant='outline' onClick={handleBackToCase}>
            Voltar para peças
          </Button>
        </div>
      ) : null}
      {!isReview && currentContent ? (
        <PendingVariableValuesDialog
          open={isPendingVariableDialogOpen}
          variables={pendingVariables}
          onOpenChange={handlePendingVariableDialogOpenChange}
          onApply={handleApplyPendingVariableValues}
        />
      ) : null}
      {!isReview ? (
        <AlertDialog
          open={isDiscardEditsDialogOpen}
          onOpenChange={(open) => !open && handleCancelDiscardEdits()}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar alterações não salvas?</AlertDialogTitle>
              <AlertDialogDescription>
                Ao alternar para outra versão, as alterações atuais serão descartadas. A
                versão salva no histórico não será modificada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDiscardEdits}>
                Continuar editando
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                onClick={handleConfirmDiscardEdits}
              >
                Descartar e alternar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {!isReview ? (
        <ElaborateDocumentVersionDialog
          open={isVersionDialogOpen}
          versions={document.versions}
          currentVersionId={currentVersion?.id ?? version.id}
          isGenerating={isGeneratingRevision}
          error={versionActionError}
          onOpenChange={handleVersionDialogOpenChange}
          onStartManual={handleStartManualVersion}
          onGenerateWithAi={handleGenerateRevision}
        />
      ) : null}
    </main>
  )
}
