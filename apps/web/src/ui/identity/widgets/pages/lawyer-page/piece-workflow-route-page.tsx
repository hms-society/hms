import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { DocumentEditor } from '@/ui/document-production/widgets/components/document-editor'
import { PieceFilePreview } from './piece-file-preview'
import { VersionHistory } from './version-history'
import { ReviewActionDialog } from './my-case-page/case-pieces-tab/piece-workflow-dialog'
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
    casePublicCode,
    isDocumentError,
    isLoadingDocument,
    isReviewConfirmed,
    reviewAction,
    version,
    handleBackToCase,
    handleChangeContent,
    handleCloseReviewAction,
    handleConfirmReviewAction,
    handleOpenReview,
    handleOpenReviewAction,
    handleReviewConfirmationChange,
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
              <span className='text-xs text-muted-foreground'>
                {editedContent ? 'Alterações locais não salvas' : 'Versão carregada'}
              </span>
              <Button variant='outline' size='sm' disabled>
                <Icon name='history' /> Versões
              </Button>
              <Button size='sm' onClick={handleOpenReview}>
                <Icon name='eye' />
                {adjustmentsRequested
                  ? 'Resubmeter para revisão'
                  : 'Submeter para revisão'}
              </Button>
            </>
          )}
        </div>
      </header>

      {isReview ? (
        <section className='grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_minmax(280px,320px)]'>
          <div className='min-w-0'>
            <VersionHistory versions={document.versions} currentVersionId={version.id} />
          </div>
          <div className='min-w-0 overflow-y-auto bg-muted/50 p-4 sm:p-6'>
            <div className='mx-auto max-w-[900px] overflow-hidden rounded-lg border bg-card shadow-sm'>
              <PieceFilePreview
                caseId={caseId}
                documentId={documentId}
                versionId={version.id}
                storagePath={version.storagePath}
                versionNumber={version.versionNumber}
              />
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
                disabled={!isReviewConfirmed}
                onClick={() => handleOpenReviewAction('approval')}
              >
                <Icon name='check' /> Aprovar peça
              </Button>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <Button
                  variant='outline'
                  onClick={() => handleOpenReviewAction('adjustments')}
                >
                  Solicitar ajustes
                </Button>
                <Button
                  variant='destructive'
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
            <VersionHistory versions={document.versions} currentVersionId={version.id} />
          </div>
          <div className='min-w-0 overflow-y-auto bg-muted/50 p-4 sm:p-6'>
            <div className='mx-auto max-w-[900px] overflow-hidden rounded-lg border bg-card shadow-sm'>
              {version.storagePath ? (
                <PieceFilePreview
                  caseId={caseId}
                  documentId={documentId}
                  versionId={version.id}
                  storagePath={version.storagePath}
                  versionNumber={version.versionNumber}
                />
              ) : currentContent ? (
                <DocumentEditor
                  content={currentContent}
                  onChange={handleChangeContent}
                  ariaLabel='Conteúdo da peça jurídica'
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
            <h2 className='font-serif font-semibold'>Documentos do dossiê</h2>
            {adjustmentsRequested ? (
              <div className='mt-3 rounded-md border border-attention bg-attention/20 p-3 text-sm'>
                Ajustes solicitados pela revisão técnica. Faça as correções antes de
                resubmeter a peça.
              </div>
            ) : null}
            <p className='mt-1 text-xs text-muted-foreground'>
              Referências usadas na elaboração desta peça.
            </p>
            <ul className='mt-4 space-y-2 text-sm'>
              {['CNIS', 'CTPS', 'Certidão de Tempo de Contribuição'].map((name) => (
                <li key={name} className='flex items-center gap-2 rounded-md border p-3'>
                  <Icon name='file-text' className='size-4 text-primary' />
                  {name}
                </li>
              ))}
            </ul>
            <p className='mt-3 text-xs text-muted-foreground'>
              A edição e o salvamento de novas versões dependem da integração de
              persistência.
            </p>
            <Button variant='outline' className='mt-5 w-full' onClick={handleOpenReview}>
              Abrir revisão técnica
            </Button>
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
    </main>
  )
}
