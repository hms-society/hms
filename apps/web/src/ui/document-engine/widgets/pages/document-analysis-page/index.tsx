import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'

import { AnalysisFormPanel } from './analysis-form-panel'
import { PdfViewerPanel } from './pdf-viewer-panel'
import { ProcessingFailurePanel } from './processing-failure-panel'
import { ReadOnlyIncompletePanel } from './read-only-incomplete-panel'
import { RequestResendModal } from './request-resend-modal'
import { useDocumentAnalysis } from './use-document-analysis'

export type DocumentAnalysisPageProps = {
  fileId: string
}

export const DocumentAnalysisPage = ({ fileId }: DocumentAnalysisPageProps) => {
  const {
    form,
    currentDecision,
    isSubmitting,
    isLoading,
    error,
    isResendModalOpen,
    onSubmit,
    handleRequestResend,
    handleCloseResendModal,
    handleConfirmResend,
    handleOpenDocument,
    document,
    documentView,
  } = useDocumentAnalysis({ fileId })

  const documentStatus = documentView.status
  const isProcessingFailure = documentStatus === 'Falha no processamento'
  const isResendRequested = documentStatus === 'Reenvio solicitado'

  if (isLoading) {
    return (
      <div className='flex min-h-[480px] w-full items-center justify-center rounded-xl border border-border bg-card shadow-card'>
        <div className='flex items-center gap-3 font-sans text-sm text-muted-foreground'>
          <Icon name='refresh-cw' className='size-4 animate-spin' />
          Carregando documento para validação...
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className='flex min-h-[480px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-card'>
        <Icon name='alert-circle' className='size-8 text-destructive' />
        <div className='flex flex-col gap-1'>
          <h1 className='font-serif text-2xl font-semibold text-brand'>
            Não foi possível carregar o documento
          </h1>
          <p className='font-sans text-sm text-muted-foreground'>
            Verifique se o documento ainda existe e tente voltar para a caixa.
          </p>
        </div>
        <Anchor
          route='documentInbox'
          className='inline-flex h-10 items-center gap-2 rounded-pill border border-border bg-transparent px-4 font-sans text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted'
        >
          <Icon name='arrow-left' className='size-4' />
          Voltar aos documentos
        </Anchor>
      </div>
    )
  }

  return (
    <>
      <div className='flex w-full flex-col gap-6'>
        <header className='flex items-center justify-between'>
          <div>
            <h1 className='font-serif text-3xl font-semibold text-brand'>
              Editor de validação
            </h1>
            <p className='mt-1 font-sans text-sm text-muted-foreground'>
              Revise o documento, confirme o vínculo e registre a decisão final.
            </p>
          </div>
          <Anchor
            route='documentInbox'
            className='inline-flex h-10 items-center gap-2 rounded-pill border border-border bg-transparent px-4 font-sans text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted'
          >
            <Icon name='arrow-left' className='size-4' />
            Voltar aos documentos
          </Anchor>
        </header>

        <div className='flex min-h-[700px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card'>
          <div className='flex items-center justify-between border-b border-border p-5'>
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center gap-3'>
                <span className='font-sans text-lg font-bold text-foreground'>
                  {documentView.fileName}
                </span>
                <Badge
                  variant='outline'
                  className='rounded-md border-border bg-muted/30 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground'
                >
                  {documentView.fileName.split('.').pop() || 'PDF'}
                </Badge>
              </div>
              <span className='font-sans text-xs text-muted-foreground'>
                {documentView.receivedFrom} • {documentView.contactInfo} • recebido{' '}
                {documentView.receivedDate} às {documentView.receivedTime}
              </span>
            </div>
            <Badge
              variant='secondary'
              className={`gap-1.5 rounded-pill border-0 px-3 py-1 font-sans text-[11px] font-semibold ${documentView.statusClasses}`}
            >
              {documentStatus === 'Aguardando validação' && (
                <Icon name='clock' className='size-3.5' />
              )}
              {documentStatus === 'Incompleto' && (
                <Icon name='file-minus' className='size-3.5' />
              )}
              {documentStatus === 'Reenvio solicitado' && (
                <Icon name='file-minus' className='size-3.5' />
              )}
              {documentStatus === 'Falha no processamento' && (
                <Icon name='alert-circle' className='size-3.5' />
              )}
              {documentStatus}
            </Badge>
          </div>

          <div className='grid flex-1 grid-cols-1 divide-y border-border lg:grid-cols-[1fr_420px] lg:divide-y-0 lg:divide-x'>
            <PdfViewerPanel
              fileSize={documentView.fileSize}
              integrity={documentView.integrity}
              duplicity={documentView.duplicity}
              onOpenDocument={() => handleOpenDocument(document.id)}
            />

            {isProcessingFailure ? (
              <ProcessingFailurePanel
                failureInstruction={documentView.failureInstruction}
                failureReason={documentView.failureReason}
                onRequestResend={handleRequestResend}
              />
            ) : isResendRequested ? (
              <ReadOnlyIncompletePanel document={document} />
            ) : (
              <AnalysisFormPanel
                form={form}
                currentDecision={currentDecision}
                isSubmitting={isSubmitting}
                confidence={documentView.confidence}
                document={document}
                onSubmit={onSubmit}
                onRequestResend={handleRequestResend}
                onOpenDocument={handleOpenDocument}
              />
            )}
          </div>
        </div>
      </div>

      <RequestResendModal
        isOpen={isResendModalOpen}
        onClose={handleCloseResendModal}
        recipientName={documentView.receivedFrom}
        recipientContact={documentView.contactInfo}
        onSend={handleConfirmResend}
      />
    </>
  )
}
