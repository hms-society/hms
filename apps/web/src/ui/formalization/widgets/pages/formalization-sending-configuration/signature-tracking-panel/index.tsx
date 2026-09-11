import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { CancelSignatureSendingDialog } from './cancel-signature-sending-dialog'
import { ResendSignatureInvitationDialog } from './resend-signature-invitation-dialog'
import { SignatureDocumentGroup } from './signature-document-group'
import { SignatureProgressSummary } from './signature-progress-summary'
import {
  useSignatureTrackingPanel,
  type SignatureTrackingPanelProps,
} from './use-signature-tracking-panel'

export type { SignatureTrackingPanelProps } from './use-signature-tracking-panel'

export const SignatureTrackingPanel = (props: SignatureTrackingPanelProps) => {
  const {
    dialog,
    handleCancelOpenChange,
    handleRefresh,
    handleRequestCancel,
    handleRequestResend,
    handleResendOpenChange,
    selectedSignatory,
    status,
  } = useSignatureTrackingPanel(props)

  return (
    <section aria-label='Acompanhar assinaturas' className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
            Solicitação de assinatura
          </p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Os dados abaixo refletem o estado confirmado pelo servidor e são atualizados
            automaticamente.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            className='min-h-11'
            disabled={props.isRefreshing}
            onClick={() => void handleRefresh()}
          >
            <Icon name='refresh-cw' className='size-4' />
            Atualizar
          </Button>
          {status.canCancel && (
            <Button
              type='button'
              variant='outline'
              className='min-h-11 text-destructive hover:text-destructive'
              disabled={props.isCancelling}
              onClick={handleRequestCancel}
            >
              {props.isCancelling ? 'Cancelando…' : 'Cancelar envio'}
            </Button>
          )}
        </div>
      </div>
      {props.isCancelling && (
        <p
          className='rounded-lg border border-border bg-muted/60 p-3 text-sm'
          role='status'
        >
          O cancelamento deste envio foi solicitado e aguarda confirmação do provedor. Os
          controles permanecem bloqueados enquanto o estado é atualizado.
        </p>
      )}
      {props.cancelError && (
        <p
          className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
          role='alert'
        >
          Não foi possível cancelar o envio. O pacote continua bloqueado até uma nova
          tentativa.
        </p>
      )}
      {props.resendError && (
        <p
          className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
          role='alert'
        >
          Não foi possível reenviar o convite. Tente novamente.
        </p>
      )}
      <SignatureProgressSummary status={status} isRefreshing={props.isRefreshing} />
      <div className='grid gap-4'>
        {status.documents.map((document) => (
          <SignatureDocumentGroup
            key={document.requestDocumentId}
            document={document}
            isResending={props.isResending}
            onRequestResend={handleRequestResend}
          />
        ))}
      </div>
      {status.documents.length === 0 && (
        <Card className='border-dashed border-border shadow-none'>
          <CardContent className='p-5 text-sm text-muted-foreground'>
            Nenhum documento foi retornado para esta solicitação.
          </CardContent>
        </Card>
      )}
      <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground'>
        <span>
          Solicitação: {status.status === 'confirmed' ? 'Confirmada' : 'Em processamento'}
        </span>
        <span>
          Protocolos e PDFs assinados são exibidos por documento quando disponíveis.
        </span>
        {status.confirmedAt && (
          <Badge variant='success'>
            Confirmada em {status.confirmedAt.toLocaleDateString('pt-BR')}
          </Badge>
        )}
      </div>
      <ResendSignatureInvitationDialog
        open={dialog === 'resend'}
        signatory={selectedSignatory}
        isPending={props.isResending}
        error={props.resendError}
        onOpenChange={handleResendOpenChange}
        onSubmit={props.onResend}
      />
      <CancelSignatureSendingDialog
        open={dialog === 'cancel'}
        formalizationVersion={props.status.formalizationVersion}
        requestVersion={props.status.version}
        isPending={props.isCancelling}
        error={props.cancelError}
        onOpenChange={handleCancelOpenChange}
        onSubmit={props.onCancel}
      />
    </section>
  )
}
