import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'

import {
  useCancelSignatureSendingDialog,
  type CancelSignatureSendingDialogProps,
} from './use-cancel-signature-sending-dialog'

export type { CancelSignatureSendingDialogProps } from './use-cancel-signature-sending-dialog'

export const CancelSignatureSendingDialog = (
  props: CancelSignatureSendingDialogProps,
) => {
  const { errorMessage, handleReasonChange, handleSubmit, reason, validationError } =
    useCancelSignatureSendingDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar envio de assinaturas?</DialogTitle>
          <DialogDescription>
            O provedor será instruído a cancelar o pacote. A configuração só poderá ser
            redefinida depois da confirmação do cancelamento.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='signature-cancellation-reason'>Motivo do cancelamento</Label>
          <Textarea
            id='signature-cancellation-reason'
            value={reason}
            maxLength={500}
            aria-invalid={Boolean(validationError)}
            aria-describedby='signature-cancellation-reason-help'
            onChange={(event) => handleReasonChange(event.target.value)}
          />
          <p
            id='signature-cancellation-reason-help'
            className='text-xs text-muted-foreground'
          >
            O motivo será registrado para auditoria. {reason.length}/500
          </p>
          {errorMessage && (
            <p role='alert' className='text-sm text-destructive'>
              {errorMessage}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
          >
            Voltar
          </Button>
          <Button
            type='button'
            variant='destructive'
            className='min-h-11'
            disabled={props.isPending}
            onClick={() => void handleSubmit()}
          >
            {props.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
