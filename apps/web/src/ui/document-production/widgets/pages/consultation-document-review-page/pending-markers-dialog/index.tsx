import { usePendingMarkersDialog } from './use-pending-markers-dialog'
import { Input } from '@/ui/shadcn/input'
import { Button } from '@/ui/shadcn/button'
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
import type { PendingMarkersDialogProps } from './types/pending-markers-dialog-props'

export type { PendingMarkersDialogProps } from './types/pending-markers-dialog-props'

export const PendingMarkersDialog = ({
  open,
  markers,
  isRemoving,
  onOpenChange,
  onLocate,
  onRemove,
  onFill,
  onRemoveAll,
}: PendingMarkersDialogProps) => {
  const {
    editingMarker,
    value,
    handleOpenChange,
    handleStartFilling,
    handleCancelFilling,
    handleValueChange,
    handleSubmit,
    getPendingMarkerLabel,
  } = usePendingMarkersDialog({ isRemoving, onOpenChange, onFill })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Pendências do documento</DialogTitle>
          <DialogDescription>
            {markers.length === 0
              ? 'Nenhuma pendência restante neste rascunho.'
              : `${markers.length} ${markers.length === 1 ? 'pendência identificada' : 'pendências identificadas'} neste documento.`}
          </DialogDescription>
        </DialogHeader>
        {markers.length > 0 && (
          <ul className='space-y-2'>
            {markers.map((item) => (
              <li
                key={item.marker}
                className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'
              >
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <p className='truncate text-sm font-semibold text-foreground'>
                    {getPendingMarkerLabel(item.marker)}
                  </p>
                  <code className='block truncate text-xs text-muted-foreground'>
                    {item.marker}
                  </code>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={isRemoving}
                    onClick={() => handleStartFilling(item.marker)}
                  >
                    <Icon name='pencil' className='size-3.5' />
                    Preencher
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={isRemoving}
                    className='items-center gap-1.5 leading-none'
                    onClick={() => onLocate(item.marker)}
                  >
                    <Icon name='search' className='size-3.5 translate-y-px' />
                    <span>Localizar</span>
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='destructive'
                    disabled={isRemoving}
                    className='items-center gap-1.5 leading-none'
                    onClick={() => onRemove(item.marker)}
                  >
                    <Icon name='trash-2' className='size-3.5 translate-y-px' />
                    <span>Remover</span>
                  </Button>
                </div>
                {editingMarker === item.marker && (
                  <form
                    className='flex w-full flex-col gap-2 sm:flex-row sm:items-end'
                    onSubmit={handleSubmit}
                  >
                    <div className='min-w-0 flex-1 space-y-2'>
                      <label
                        htmlFor='pending-marker-value'
                        className='text-sm font-medium'
                      >
                        {getPendingMarkerLabel(item.marker)}
                      </label>
                      <Input
                        id='pending-marker-value'
                        autoFocus
                        value={value}
                        disabled={isRemoving}
                        onChange={handleValueChange}
                      />
                      <p className='text-xs text-muted-foreground'>
                        O valor substituirá este marcador em todo o documento e será salvo
                        em uma nova versão.
                      </p>
                    </div>
                    <Button
                      type='submit'
                      size='sm'
                      disabled={isRemoving || !value.trim()}
                    >
                      {isRemoving ? 'Salvando…' : 'Salvar valor'}
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      disabled={isRemoving}
                      onClick={handleCancelFilling}
                    >
                      Cancelar
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          {markers.length > 0 && (
            <Button
              type='button'
              variant='outline'
              disabled={isRemoving}
              className='items-center gap-1.5 text-destructive leading-none hover:text-destructive'
              onClick={onRemoveAll}
            >
              <Icon name='trash-2' className='size-4 translate-y-px' />
              <span>Remover todas</span>
            </Button>
          )}
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
