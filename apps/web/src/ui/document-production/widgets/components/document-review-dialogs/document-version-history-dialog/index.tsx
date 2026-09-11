import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { DocumentStatusChip } from '@/ui/document-production/widgets/components/document-status-chip'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DocumentVersionHistoryItem = {
  id: string
  versionNumber: number
  sourceLabel: string
  status: 'in_review' | 'approved' | 'rejected'
  statusLabel: string
  createdAtLabel: string
  rejectionReason?: string
  isCurrent: boolean
}

export type DocumentVersionHistoryDialogProps = {
  open: boolean
  title?: string
  items: readonly DocumentVersionHistoryItem[]
  onOpenChange: (open: boolean) => void
  onSelect: (versionId: string) => void
  onSelectCurrent?: (versionId: string) => void
  isSelectingCurrent?: boolean
}

export const DocumentVersionHistoryDialog = ({
  open,
  title,
  items,
  onOpenChange,
  onSelect,
  onSelectCurrent,
  isSelectingCurrent = false,
}: DocumentVersionHistoryDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      className='max-h-[min(680px,calc(100vh-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[680px]'
    >
      <DialogHeader className='relative px-5 pt-5 pr-16 pb-4'>
        <DialogTitle className='font-serif font-semibold'>
          Histórico de versões
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {title} · consulte e compare as versões deste documento.
        </DialogDescription>
        <DialogClose asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Fechar histórico de versões'
            className='absolute top-4 right-4 rounded-full bg-secondary hover:bg-secondary/80'
          >
            <Icon name='x' />
          </Button>
        </DialogClose>
      </DialogHeader>
      <div className='h-px bg-border' />
      <ul className='max-h-[55vh] overflow-y-auto px-6'>
        {items.map((item) => (
          <li
            key={item.id}
            className='flex flex-col gap-3 border-b py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
          >
            <div className='min-w-0 flex-1 space-y-1.5'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='font-serif text-base font-semibold'>
                  Versão {item.versionNumber}
                </h3>
                <DocumentStatusChip status={item.status} label={item.statusLabel} />
                {item.isCurrent && <DocumentStatusChip status='current' />}
              </div>
              <p className='flex flex-wrap items-center gap-1 text-xs text-muted-foreground'>
                <span>{item.sourceLabel}</span>
                <span aria-hidden='true'>·</span>
                <span>{item.createdAtLabel}</span>
              </p>
              {item.rejectionReason && (
                <p className='text-xs text-muted-foreground'>
                  Motivo: {item.rejectionReason}
                </p>
              )}
            </div>
            <div className='flex shrink-0 flex-wrap justify-end gap-2'>
              {item.status === 'approved' && !item.isCurrent && onSelectCurrent && (
                <Button
                  type='button'
                  size='sm'
                  variant='default'
                  className='items-center gap-1.5 rounded-full px-4 leading-none'
                  disabled={isSelectingCurrent}
                  onClick={() => onSelectCurrent(item.id)}
                >
                  <Icon name='shield-check' className='size-3.5 translate-y-px' />
                  <span>{isSelectingCurrent ? 'Atualizando…' : 'Tornar vigente'}</span>
                </Button>
              )}
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='items-center gap-1.5 rounded-full border-primary px-5 text-primary leading-none'
                onClick={() => onSelect(item.id)}
              >
                <Icon name='eye' className='size-3.5 translate-y-px' />
                <span>Visualizar</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </DialogContent>
  </Dialog>
)
