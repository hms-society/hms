import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'

import {
  useResendSignatureInvitationDialog,
  type ResendSignatureInvitationDialogProps,
} from './use-resend-signature-invitation-dialog'

export type { ResendSignatureInvitationDialogProps } from './use-resend-signature-invitation-dialog'

export const ResendSignatureInvitationDialog = (
  props: ResendSignatureInvitationDialogProps,
) => {
  const { handleSubmit, message } = useResendSignatureInvitationDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reenviar convite?</DialogTitle>
          <DialogDescription>
            {props.signatory
              ? `Um novo convite será enviado para ${props.signatory.displayName} pelo canal configurado. O convite anterior perderá o acesso.`
              : 'Selecione um signatário para reenviar o convite.'}
          </DialogDescription>
        </DialogHeader>
        {message && (
          <p role='alert' className='text-sm text-destructive'>
            {message}
          </p>
        )}
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            className='min-h-11'
            disabled={!props.signatory || props.isPending || !props.signatory.canResend}
            onClick={() => void handleSubmit()}
          >
            {props.isPending ? 'Reenviando…' : 'Confirmar reenvio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
