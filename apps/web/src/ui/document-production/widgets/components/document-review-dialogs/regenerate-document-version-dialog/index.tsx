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
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RegenerateDocumentVersionDialogProps = {
  open: boolean
  isRegenerating: boolean
  instructions: string
  onOpenChange: (open: boolean) => void
  onInstructionsChange: (instructions: string) => void
  onConfirm: (instructions: string) => void
}

export const RegenerateDocumentVersionDialog = ({
  open,
  isRegenerating,
  instructions,
  onOpenChange,
  onInstructionsChange,
  onConfirm,
}: RegenerateDocumentVersionDialogProps) => {
  const canConfirm = instructions.trim().length > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='!max-w-[480px] gap-0 overflow-hidden p-0'>
        <AlertDialogHeader className='relative border-b px-5 py-4 pr-14 text-left sm:place-items-start'>
          <AlertDialogTitle className='font-serif text-lg font-semibold'>
            Gerar nova versão
          </AlertDialogTitle>
          <AlertDialogCancel
            variant='ghost'
            size='icon-sm'
            aria-label='Fechar geração de nova versão'
            disabled={isRegenerating}
            className='absolute top-3 right-3 rounded-full text-muted-foreground hover:bg-secondary'
          >
            <Icon name='x' />
          </AlertDialogCancel>
        </AlertDialogHeader>
        <div className='px-5 py-5'>
          <AlertDialogDescription className='text-sm leading-6 text-foreground'>
            Descreva o que deve mudar. A IA criará uma nova versão e manterá a versão
            atual no histórico.
          </AlertDialogDescription>
          <div className='mt-4 grid gap-2'>
            <label
              htmlFor='regenerate-document-instructions'
              className='text-xs font-medium'
            >
              Instruções para a nova versão <span aria-hidden='true'>*</span>
            </label>
            <textarea
              id='regenerate-document-instructions'
              aria-label='Instruções para a nova versão *'
              value={instructions}
              onChange={(event) => onInstructionsChange(event.target.value)}
              disabled={isRegenerating}
              maxLength={4000}
              rows={4}
              placeholder='Ex.: Atualizar a qualificação das partes e incluir a cláusula solicitada.'
              className='min-h-25 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
            />
            <p className='text-xs text-muted-foreground'>
              A nova versão ficará pronta para revisão antes de liberar o documento.
            </p>
          </div>
        </div>
        <AlertDialogFooter className='mx-0 mb-0 gap-2 rounded-b-xl px-5 py-4'>
          <AlertDialogCancel
            disabled={isRegenerating}
            className='rounded-full border-primary/60 px-4'
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isRegenerating || !canConfirm}
            className='rounded-full px-4'
            onClick={(event) => {
              event.preventDefault()
              onConfirm(instructions.trim())
            }}
          >
            <Icon name='refresh-cw' />
            {isRegenerating ? 'Solicitando…' : 'Gerar nova versão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
