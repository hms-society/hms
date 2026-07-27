import { cn } from '@/ui/shadcn/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogState } from '../use-client-register-dialog'
import { useClientRegisterDialogStepper } from './use-client-register-dialog-stepper'

export type ClientRegisterDialogStepperProps = {
  state: ClientRegisterDialogState
}

export const ClientRegisterDialogStepper = ({
  state,
}: ClientRegisterDialogStepperProps) => {
  const { steps } = useClientRegisterDialogStepper(state)

  return (
    <nav aria-label='Etapas do cadastro' className='overflow-x-auto pb-1'>
      <ol className='flex min-w-max items-center gap-2 font-sans text-xs text-muted-foreground'>
        {steps.map(function renderStep(step) {
          return (
            <li key={step.key} className='flex items-center gap-2'>
              <span
                aria-current={step.isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5',
                  step.isCurrent && 'border-primary bg-primary text-primary-foreground',
                  step.isCompleted && 'border-primary/40 text-primary',
                )}
              >
                <Icon name={step.isCompleted ? 'check' : 'circle'} />
                <span>{step.label}</span>
                {step.isCurrent && <span className='sr-only'>(atual)</span>}
              </span>
              {step.hasSeparator && (
                <Icon name='arrow-right' className='size-3 text-muted-foreground/60' />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
