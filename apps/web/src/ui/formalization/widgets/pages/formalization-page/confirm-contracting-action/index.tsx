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

import {
  useConfirmContractingAction,
  type ConfirmContractingActionProps,
} from './use-confirm-contracting-action'

export type { ConfirmContractingActionProps } from './use-confirm-contracting-action'

export const ConfirmContractingAction = (props: ConfirmContractingActionProps) => {
  const { canConfirm, handleSubmit, isCompleted, isDialogOpen, setIsDialogOpen } =
    useConfirmContractingAction(props)

  return (
    <section
      className='flex flex-col gap-2 rounded-xl border border-brand/40 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between'
      aria-labelledby='confirm-contracting-title'
    >
      <div>
        <h2 id='confirm-contracting-title' className='font-serif text-lg font-semibold'>
          Confirmar contratação
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {isCompleted
            ? 'A contratação foi confirmada e o Intake foi marcado como contratado.'
            : canConfirm
              ? 'Todos os documentos, assinaturas, PDFs e protocolos estão confirmados.'
              : 'A ação será habilitada quando todos os documentos, assinaturas, PDFs e protocolos estiverem confirmados.'}
        </p>
      </div>
      <Button
        type='button'
        className='min-h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto'
        disabled={!canConfirm || props.isPending}
        onClick={() => setIsDialogOpen(true)}
      >
        <Icon name='check-circle-2' className='size-4' />
        {isCompleted ? 'Contratação confirmada' : 'Confirmar contratação'}
      </Button>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar contratação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação conclui a Formalização e marca o Intake como contratado. Nenhum
              caso será criado ou solicitado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {props.error && (
            <p role='alert' className='text-sm text-destructive'>
              Não foi possível confirmar a contratação. Atualize o acompanhamento e tente
              novamente.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={props.isPending}
              onClick={() => void handleSubmit()}
            >
              {props.isPending ? 'Confirmando…' : 'Confirmar contratação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
