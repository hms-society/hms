import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProcessingFailurePanelProps = {
  failureInstruction?: string
  failureReason?: string
  onRequestResend: () => void
}

export const ProcessingFailurePanel = ({
  failureInstruction,
  failureReason,
  onRequestResend,
}: ProcessingFailurePanelProps) => (
  <aside className='flex flex-col bg-card'>
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-3'>
        <h2 className='font-sans text-sm font-semibold text-foreground'>
          Motivo da falha
        </h2>
        <div className='flex items-start gap-3 rounded-lg border border-border bg-[#FAF8F5] p-4'>
          <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-muted-foreground shadow-sm'>
            <Icon name='lock' className='size-4' />
          </div>
          <div className='flex flex-col'>
            <span className='font-sans text-sm font-semibold text-foreground'>
              {failureReason ?? 'Falha no processamento'}
            </span>
            <span className='mt-0.5 font-sans text-xs text-muted-foreground'>
              Não foi possível analisar o documento automaticamente. Siga a orientação
              abaixo para corrigir o problema.
            </span>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <h2 className='font-sans text-sm font-semibold text-foreground'>Como resolver</h2>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-3 rounded-lg border border-border/50 bg-muted/40 p-4'>
            <Icon name='send' className='size-4 text-muted-foreground' />
            <span className='font-sans text-sm text-foreground'>
              {failureInstruction ??
                'Solicite ao remetente uma nova cópia do arquivo e tente novamente.'}
            </span>
          </div>
          <div className='flex items-center gap-2 px-1'>
            <Icon name='alert-circle' className='size-3.5 text-muted-foreground' />
            <span className='font-sans text-xs text-muted-foreground'>
              Não solicite nem registre credenciais no sistema.
            </span>
          </div>
        </div>
      </div>
    </div>
    <footer className='mt-auto flex items-center justify-end border-t border-border bg-card p-5'>
      <Button
        type='button'
        variant='brand'
        className='h-11 gap-2 rounded-pill px-6 font-sans text-sm font-medium'
        onClick={onRequestResend}
      >
        <Icon name='send' className='size-4' />
        Solicitar reenvio
      </Button>
    </footer>
  </aside>
)
