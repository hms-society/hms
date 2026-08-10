import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

type RemoveDocumentSpecificationSectionProps = {
  modelName: string
  open: boolean
  isRemoving: boolean
  onOpenChange: (open: boolean) => void
  onRequestRemove: () => void
  onConfirmRemove: () => void
}

export function RemoveDocumentSpecificationSection({
  modelName,
  open,
  isRemoving,
  onOpenChange,
  onRequestRemove,
  onConfirmRemove,
}: RemoveDocumentSpecificationSectionProps) {
  return (
    <section className='overflow-hidden rounded-xl border border-destructive/30 bg-card'>
      <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <h2 className='text-base font-semibold'>Remover modelo</h2>
          <p className='max-w-2xl text-xs text-muted-foreground'>
            Exclua este modelo e suas configurações permanentemente. Essa ação não pode
            ser desfeita.
          </p>
        </div>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          className='w-full sm:w-auto'
          onClick={onRequestRemove}
        >
          <Icon name='trash-2' className='size-4' />
          Remover modelo
        </Button>
      </div>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo <strong>{modelName || 'sem nome'}</strong>, sua configuração e seu
              template serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault()
                onConfirmRemove()
              }}
            >
              {isRemoving ? 'Removendo…' : 'Remover modelo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
