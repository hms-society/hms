import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortalAccessDialogProps = {
  expiresAt: string | null
  onCopy: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  url: string | null
}

export const PortalAccessDialog = ({
  expiresAt,
  onCopy,
  onOpenChange,
  open,
  url,
}: PortalAccessDialogProps) => {
  const expirationLabel = expiresAt
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(expiresAt))
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-xl text-brand'>
            Link para terceiro gerado
          </DialogTitle>
          <DialogDescription>
            Compartilhe este link com o terceiro para que ele envie os documentos do
            cliente. O link expira em {expirationLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2'>
          <label
            htmlFor='portal-access-url'
            className='text-sm font-medium text-foreground'
          >
            Link de acesso
          </label>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Input
              id='portal-access-url'
              readOnly
              value={url ?? ''}
              className='min-w-0'
            />
            <Button type='button' className='rounded-full sm:shrink-0' onClick={onCopy}>
              <Icon name='copy' className='size-4' />
              Copiar link
            </Button>
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
