import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useSignatureFieldsProgressDialog,
  type SignatureFieldsProgressDialogProps,
} from './use-signature-fields-progress-dialog'

export const SignatureFieldsProgressDialog = (
  props: SignatureFieldsProgressDialogProps,
) => {
  const controller = useSignatureFieldsProgressDialog(props)

  return (
    <Dialog open={controller.open} onOpenChange={controller.handleOpenChange}>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label={`Ver campos de ${props.documentName}`}
        onClick={() => controller.handleOpenChange(true)}
      >
        <Icon name='eye' className='size-4' />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Campos de assinatura</DialogTitle>
          <DialogDescription>
            Acompanhe a configuração dos signatários em {props.documentName}.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <p className='text-sm font-medium'>
            {controller.configuredSignatoriesCount}/{props.signatories.length}{' '}
            configurados
          </p>
          {controller.signatoryStatuses.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Nenhum signatário atribuído a este documento.
            </p>
          ) : (
            <ul className='space-y-2'>
              {controller.signatoryStatuses.map((signatory) => (
                <li
                  key={signatory.signatoryId}
                  className='flex items-center justify-between gap-3 rounded-md border border-border p-3'
                >
                  <span className='text-sm'>{signatory.name}</span>
                  <Badge variant={signatory.isConfigured ? 'success' : 'secondary'}>
                    {signatory.isConfigured ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
