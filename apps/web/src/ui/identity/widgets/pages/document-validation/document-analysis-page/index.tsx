import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { useDocumentAnalysis } from './use-document-analysis'
import { PdfViewerPanel } from '../../../components/document-analysis-components/pdf-viewer-panel'
import { AnalysisFormPanel } from '../../../components/document-analysis-components/analysis-form-panel'
import { RequestResendModal } from '../../../components/document-analysis-components/request-resend-modal'

export type DocumentAnalysisPageProps = {
  fileId: string
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Falha no processamento':
    case 'Incompleto':
      return 'bg-[#FFF3E0] text-[#7C4700]'
    case 'Ilegível':
      return 'bg-[#FFEBEE] text-[#7B1515]'
    case 'Validado':
      return 'bg-[#E8F5E9] text-[#1B5E20]'
    case 'Duplicado':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-[#E1F5F6] text-[#0F5C61]'
  }
}

const ProcessingFailurePanel = ({ onRequestResend }: { onRequestResend: () => void }) => (
  <aside className="flex flex-col bg-card">
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <h2 className="font-sans text-sm font-semibold text-foreground">Motivo da falha</h2>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-[#FAF8F5] p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-muted-foreground shadow-sm">
            <Icon name="lock" className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-semibold text-foreground">Arquivo protegido por senha</span>
            <span className="mt-0.5 font-sans text-xs text-muted-foreground">
              Não foi possível analisar o documento porque ele exige uma senha para acesso.
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-sans text-sm font-semibold text-foreground">Como resolver</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/40 p-4">
            <Icon name="send" className="size-4 text-muted-foreground" />
            <span className="font-sans text-sm text-foreground">
              Solicite ao remetente uma nova cópia do arquivo sem proteção por senha.
            </span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <Icon name="alert-circle" className="size-3.5 text-muted-foreground" />
            <span className="font-sans text-xs text-muted-foreground">
              Não solicite nem registre a senha no sistema.
            </span>
          </div>
        </div>
      </div>
    </div>
    <footer className="mt-auto flex items-center justify-end border-t border-border bg-card p-5">
      <Button
        type="button"
        variant="brand"
        className="h-11 gap-2 rounded-pill px-6 font-sans text-sm font-medium"
        onClick={onRequestResend}
      >
        <Icon name="send" className="size-4" />
        Solicitar reenvio
      </Button>
    </footer>
  </aside>
)

const ReadOnlyIncompletePanel = () => (
  <aside className="flex flex-col overflow-y-auto bg-card">
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-sm font-semibold text-foreground">Resultado da validação</h2>
        <Badge variant="secondary" className="gap-1 border-0 bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#1B5E20]">
          <Icon name="check-circle-2" className="size-3" />
          Decisão registrada
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Icon name="file-minus" className="size-4 text-foreground" />
            <span className="font-sans text-sm font-medium text-foreground">Incompleto</span>
          </div>
          <Icon name="lock" className="size-4 text-muted-foreground" />
        </div>
        <div className="flex items-start gap-3 rounded-md border border-[#A5D6A7] bg-[#E8F5E9]/50 p-4">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">
            <Icon name="send" className="size-3 text-[#1B5E20]" />
          </div>
          <div className="flex flex-1 flex-col">
            <span className="font-sans text-sm font-semibold text-[#1B5E20]">Reenvio solicitado</span>
            <span className="mt-0.5 font-sans text-xs text-[#1B5E20]/70">Enviado para Mariana Costa Silva por e-mail hoje às 14:48.</span>
          </div>
          <Icon name="check" className="size-4 text-[#1B5E20]" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-sm font-semibold text-foreground">Vínculo ao checklist</h2>
          <span className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground">
            <Icon name="lock" className="size-3" /> Somente leitura
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-xs text-muted-foreground">Caso</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground">
              <Icon name="briefcase" className="size-4 text-muted-foreground" />
              Caso 0089
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-xs text-muted-foreground">Item do checklist</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground">
              <Icon name="list-checks" className="size-4 text-muted-foreground" />
              Comprovante de residência
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-sm font-semibold text-foreground">Campos extraídos</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground">
              <Icon name="lock" className="size-3" /> Somente leitura
            </span>
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">4 de 5</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-xs text-muted-foreground">Titular</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground">
              <Icon name="user" className="size-4 text-muted-foreground" />
              Mariana Costa Silva
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-xs text-muted-foreground">CPF</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground">
              <Icon name="credit-card" className="size-4 text-muted-foreground" />
              284.***.***-19
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border border-[#FDECC8] bg-[#FFF8EB] p-3">
            <Icon name="alert-triangle" className="mt-0.5 size-4 text-[#E6A23C]" />
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold text-[#7C4700]">Data de emissão não identificada</span>
              <span className="font-sans text-[10px] text-[#7C4700]/70">Campo obrigatório antes da validação.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
)

export const DocumentAnalysisPage = ({ fileId }: DocumentAnalysisPageProps) => {
  const {
    form,
    currentDecision,
    isSubmitting,
    isResendModalOpen,
    onSubmit,
    handleRequestResend,
    handleCloseResendModal,
    handleConfirmResend,
    mockDocument
  } = useDocumentAnalysis({ fileId })

  const documentStatus = mockDocument.status
  const isProcessingFailure = documentStatus === 'Falha no processamento'
  const isIncomplete = documentStatus === 'Incompleto'

  return (
    <>
      <div className="flex w-full flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-brand">Editor de validação</h1>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Revise o documento, confirme o vínculo e registre a decisão final.
            </p>
          </div>
          <Anchor
            route="documentInbox"
            className="inline-flex h-10 items-center gap-2 rounded-pill border border-border bg-transparent px-4 font-sans text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Icon name="arrow-left" className="size-4" />
            Voltar aos documentos
          </Anchor>
        </header>

        <div className="flex min-h-[700px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span className="font-sans text-lg font-bold text-foreground">
                  {mockDocument.fileName}
                </span>
                <Badge variant="outline" className="rounded-md border-border bg-muted/30 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                  {mockDocument.fileName.split('.').pop() || 'PDF'}
                </Badge>
              </div>
              <span className="font-sans text-xs text-muted-foreground">
                {mockDocument.receivedFrom} • {mockDocument.contactInfo} • recebido {mockDocument.receivedDate} às {mockDocument.receivedTime}
              </span>
            </div>
            <Badge variant="secondary" className={`gap-1.5 rounded-pill border-0 px-3 py-1 font-sans text-[11px] font-semibold ${getStatusStyles(documentStatus)}`}>
              {documentStatus === 'Aguardando validação' && <Icon name="clock" className="size-3.5" />}
              {documentStatus === 'Incompleto' && <Icon name="file-minus" className="size-3.5" />}
              {documentStatus === 'Falha no processamento' && <Icon name="alert-circle" className="size-3.5" />}
              {documentStatus}
            </Badge>
          </div>

          <div className="grid flex-1 grid-cols-1 divide-y border-border lg:grid-cols-[1fr_420px] lg:divide-y-0 lg:divide-x">
            <PdfViewerPanel
              fileSize={mockDocument.fileSize}
              integrity={mockDocument.integrity}
              duplicity={mockDocument.duplicity}
            />
            
            {isProcessingFailure ? (
              <ProcessingFailurePanel onRequestResend={handleRequestResend} />
            ) : isIncomplete ? (
              <ReadOnlyIncompletePanel />
            ) : (
              <AnalysisFormPanel
                form={form}
                currentDecision={currentDecision}
                isSubmitting={isSubmitting}
                confidence={mockDocument.confidence}
                onSubmit={onSubmit}
                onRequestResend={handleRequestResend}
              />
            )}
          </div>
        </div>
      </div>

      <RequestResendModal 
        isOpen={isResendModalOpen} 
        onClose={handleCloseResendModal}
        recipientName={mockDocument.receivedFrom}
        recipientContact={mockDocument.contactInfo}
        onSend={handleConfirmResend}
      />
    </>
  )
}