import { Button } from '@/ui/shadcn/button'
import { Textarea } from '@/ui/shadcn/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ViewRejectionReasonDialogProps = {
  open: boolean
  reason: string
  onOpenChange: (open: boolean) => void
}

export const ViewRejectionReasonDialog = ({
  open,
  reason,
  onOpenChange,
}: ViewRejectionReasonDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      className='gap-0 overflow-hidden p-0 sm:max-w-[400px]'
    >
      <DialogHeader className='relative border-b px-4 py-4 pr-12'>
        <DialogTitle className='font-serif text-lg leading-tight font-semibold'>
          Motivo da rejeição
        </DialogTitle>
        <DialogClose asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Fechar motivo da rejeição'
            className='absolute top-3 right-3 rounded-full bg-secondary hover:bg-secondary/80'
          >
            <Icon name='x' />
          </Button>
        </DialogClose>
      </DialogHeader>
      <div className='space-y-3 px-4 py-4'>
        <DialogDescription className='text-md leading-relaxed text-foreground'>
          Este motivo foi registrado ao rejeitar esta versão.
        </DialogDescription>
        <Textarea
          aria-label='Motivo da rejeição'
          readOnly
          rows={2}
          value={reason}
          className='min-h-12 resize-none bg-muted/30 leading-relaxed text-foreground'
        />
      </div>
      <DialogFooter className='mx-0 mb-0 px-4 py-3'>
        <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
