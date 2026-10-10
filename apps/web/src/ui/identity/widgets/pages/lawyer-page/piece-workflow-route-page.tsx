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

export function PieceWorkflowRoutePage({
  mode,
  caseId,
  documentId,
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
    isReviewPending,
    reviewRequest,
    isReviewerEligible = !isAuthor,
    isCheckingReviewer,
    isPendingVariableDialogOpen,
    isVersionDialogOpen,
    isStartingManualVersion,
    isGeneratingRevision,
    pendingGenerationVersion,
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
  const isVersionGenerating = Boolean(
    isGeneratingRevision ||
      pendingGenerationVersion ||
      document.generation?.status === 'pending' ||
      document.generation?.status === 'running' ||
      document.versions.some((item) => item.status === 'generating'),
  )
  const versionsForHistory = pendingGenerationVersion
    ? [
        ...document.versions,
        {
          id: pendingGenerationVersion.id,
          versionNumber: pendingGenerationVersion.versionNumber,
          status: 'generating',
          createdAt: pendingGenerationVersion.createdAt,
          rejectionReason: undefined,
        },
      ]
    : document.versions
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
              <Badge
                variant={
                  isReview && version.status === 'approved'
                    ? 'success'
                    : isReview && version.status !== 'rejected'
                      ? 'info'
                      : 'attention'
                }
              >
                {isReview
                  ? version.status === 'approved'
                    ? 'Aprovada'
                    : version.status === 'rejected'
                      ? 'Requer ajustes'
                      : 'Submetido para revisão'
                  : isReadOnlyVersion
                    ? `Somente leitura · v${version.versionNumber}`
                    : reviewRequest
                      ? `Requer ajustes · v${version.versionNumber}`
                      : `Em elaboração · v${version.versionNumber}`}
              </Badge>
              {isReviewPending ? (
                <Badge variant='attention'>Pendente de ajustes</Badge>
              ) : null}
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
                  {reviewRequest ? 'Resubmeter para revisão' : 'Submeter para revisão'}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </header>

      {isVersionGenerating ? (
        <div
          className='flex items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary'
          role='status'
          aria-live='polite'
        >
          <Icon name='refresh-cw' className='size-4 animate-spin' />
          <span>
            Gerando nova versão por IA… O histórico será atualizado automaticamente quando
            o processamento terminar.
          </span>
        </div>
      ) : null}

      {isReview && isAuthor && version.status === 'in_review' ? (
        <div
          className='border-b border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary'
          role='status'
        >
          <strong>Submetido para revisão</strong> — esta versão foi enviada para revisão
          técnica.
        </div>
      ) : null}

      {isReview ? (
        <section className='grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_minmax(280px,320px)]'>
          <div className='min-w-0'>
            <VersionHistory
              versions={versionsForHistory}
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
            {version.status === 'approved' ? (
              <div
                role='status'
                className='flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-badge-success-border bg-badge-success p-6 text-center text-badge-success-foreground'
              >
                <Icon name='check' className='size-8' />
                <p className='font-medium'>Documento revisado com sucesso</p>
              </div>
            ) : (
              <>
                <section>
                  <h2 className='font-serif font-semibold'>Alertas de revisão</h2>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Apontamentos e solicitações reais desta versão.
                  </p>
                  <div className='mt-3 space-y-2'>
                    {version.status === 'in_review' ? (
                      <article className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive'>
                        <div className='flex items-center justify-between gap-2'>
                          <h3 className='text-sm font-medium'>Submetido para revisão</h3>
                          <Badge variant='info'>Em análise</Badge>
                        </div>
                        <p className='mt-2 text-xs'>
                          A versão foi enviada pelo colaborador responsável e aguarda a
                          decisão de um revisor elegível.
                        </p>
                      </article>
                    ) : reviewRequest ? (
                      <article className='rounded-md border border-destructive/30 bg-destructive/5 p-3'>
                        <h3 className='text-sm font-medium'>Solicitação de ajustes</h3>
                        <p className='mt-2 text-xs text-muted-foreground'>
                          {version.reviewedByCollaboratorName
                            ? `${version.reviewedByCollaboratorName}: `
                            : ''}
                          {reviewRequest}
                        </p>
                      </article>
                    ) : (
                      <p className='rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground'>
                        Nenhum alerta de revisão registrado para esta versão.
                      </p>
                    )}
                  </div>
                </section>
                <section className='border-t pt-4'>
                  <h2 className='font-serif font-semibold'>Revisões dos membros</h2>
                  <p className='mt-2 rounded-md border bg-muted/30 p-3 text-xs'>
                    Comentários e histórico de revisão serão exibidos aqui quando
                    disponíveis para esta versão.
                  </p>
                </section>
                <div className='mt-auto space-y-2 border-t pt-4'>
                  {isAuthor || !isReviewerEligible ? (
                    <p
                      role='alert'
                      className='rounded-md border border-attention bg-attention/20 p-3 text-xs'
                    >
                      {isAuthor
                        ? 'O criador do documento não pode participar da revisão técnica. Outro membro elegível deve assumir a revisão.'
                        : 'Apenas membros da equipe do caso, supervisores ou administradores podem decidir esta revisão técnica.'}
                    </p>
                  ) : null}
                  <label
                    htmlFor='review-responsibility-confirmation'
                    className='flex items-start gap-2 rounded-md border border-primary/50 bg-primary/10 p-3 text-xs'
                  >
                    <Checkbox
                      id='review-responsibility-confirmation'
                      checked={isReviewConfirmed}
                      disabled={isAuthor || !isReviewerEligible || isCheckingReviewer}
                      onCheckedChange={(checked) =>
                        handleReviewConfirmationChange(checked === true)
                      }
                    />
                    Confirmo minha responsabilidade técnica sobre o conteúdo desta peça e
                    sua aptidão para protocolo ou entrega.
                  </label>
                  <Button
                    className='w-full'
                    disabled={
                      isAuthor ||
                      !isReviewerEligible ||
                      !isReviewConfirmed ||
                      isCheckingReviewer
                    }
                    onClick={() => handleOpenReviewAction('approval')}
                  >
                    <Icon name='check' /> Aprovar peça
                  </Button>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    <Button
                      variant='outline'
                      disabled={isAuthor || !isReviewerEligible || isCheckingReviewer}
                      onClick={() => handleOpenReviewAction('adjustments')}
                    >
                      Solicitar ajustes
                    </Button>
                    <Button
                      variant='destructive'
                      disabled={isAuthor || !isReviewerEligible || isCheckingReviewer}
                      onClick={() => handleOpenReviewAction('block')}
                    >
                      Bloqueio
                    </Button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </section>
      ) : (
        <section className='grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_minmax(280px,300px)]'>
          <div className='min-w-0'>
            <VersionHistory
              versions={versionsForHistory}
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
            <section className='mb-5 border-b pb-4'>
              <h2 className='font-serif font-semibold'>Alertas de revisão</h2>
              {reviewRequest ? (
                <p className='mt-3 whitespace-pre-wrap break-words rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm'>
                  {reviewRequest}
                </p>
              ) : (
                <p className='mt-3 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'>
                  Nenhum alerta de revisão registrado para esta versão.
                </p>
              )}
            </section>
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
          documentAuthorName={version.createdByCollaboratorName}
          onConfirm={handleConfirmReviewAction}
          onOpenChange={(open) => !open && handleCloseReviewAction()}
        />
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
          isGenerating={isGeneratingRevision || isStartingManualVersion}
          error={versionActionError}
          onOpenChange={handleVersionDialogOpenChange}
          onStartManual={handleStartManualVersion}
          onGenerateWithAi={handleGenerateRevision}
        />
      ) : null}
    </main>
  )
}
