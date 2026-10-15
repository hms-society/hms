import type { ChecklistTabState } from '../types'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { GateMessages } from '../gate-messages'
import { ChecklistGateActions } from '../checklist-gate-actions'

export type ChecklistGateSectionProps = {
  disabledReason?: string
  readOnly: boolean
  state: ChecklistTabState
}

export const ChecklistGateSection = ({
  disabledReason,
  readOnly,
  state,
}: ChecklistGateSectionProps) => (
  <div className='flex flex-col justify-between gap-4 rounded-lg border border-accent bg-accent px-4 py-2.5 lg:flex-row lg:items-start'>
    <div className='flex items-start gap-3'>
      <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-accent-foreground'>
        <Icon name='lock' className='size-3.5' />
      </div>
      <div className='flex flex-col gap-0.5'>
        <h2 className='text-[14px] font-semibold text-accent-foreground'>
          Gate de produção jurídica
        </h2>
        <p className='text-[14px] text-accent-foreground/80'>
          Checklist e Dossiê Documental são gates sequenciais. O checklist pode avançar
          com aprovação humana, mas a escrita jurídica segue bloqueada até homologação do
          dossiê.
        </p>
        <div className='mt-1 flex flex-wrap gap-1.5'>
          <Badge variant='attention' className='h-6 rounded-full px-3 text-[12px]'>
            {state.checklistGateLabel}
          </Badge>
          <Badge variant='secondary' className='h-6 rounded-full px-3 text-[12px]'>
            {state.dossierGateLabel}
          </Badge>
          {!state.canStartLegalWriting && (
            <Badge variant='outline' className='h-6 rounded-full px-3 text-[12px]'>
              Escrita bloqueada
            </Badge>
          )}
        </div>
        <GateMessages disabledReason={disabledReason} state={state} />
      </div>
    </div>
    {!readOnly && <ChecklistGateActions state={state} />}
  </div>
)
