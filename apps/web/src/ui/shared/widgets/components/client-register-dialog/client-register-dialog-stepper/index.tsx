import { cn } from '@/ui/shadcn/utils'

import type { ClientRegisterDialogState } from '../use-client-register-dialog'
import { useClientRegisterDialogStepper } from './use-client-register-dialog-stepper'

export type ClientRegisterDialogStepperProps = {
  state: ClientRegisterDialogState
}

export const ClientRegisterDialogStepper = ({
  state,
}: ClientRegisterDialogStepperProps) => {
  const { currentStep, currentStepNumber, steps, stepsCount } =
    useClientRegisterDialogStepper(state)

  return (
    <nav aria-label='Etapas do cadastro' className='mt-2 font-sans'>
      <div className='mb-2 flex items-center justify-between gap-4 text-xs'>
        <span className='font-semibold text-foreground'>
          Etapa {currentStepNumber} de {stepsCount}
        </span>
        <span className='truncate text-muted-foreground'>{currentStep.label}</span>
      </div>
      <ol className='grid grid-cols-5 gap-1.5'>
        {steps.map(function renderStep(step) {
          return (
            <li key={step.key} aria-current={step.isCurrent ? 'step' : undefined}>
              <span
                aria-hidden='true'
                className={cn(
                  'block h-1.5 rounded-full bg-muted',
                  (step.isCurrent || step.isCompleted) && 'bg-primary',
                )}
              />
              <span className='sr-only'>
                {step.label}
                {step.isCurrent ? ' (atual)' : ''}
                {step.isCompleted ? ' (concluída)' : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
