'use client'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type StepperStep = {
  label: string
  description?: string
  date?: string
  time?: string
}

export type StepperProps = {
  steps: StepperStep[]
  activeStep: number
  orientation?: 'horizontal' | 'vertical'
}

export const Stepper = ({
  steps,
  activeStep,
  orientation = 'horizontal',
}: StepperProps) => {
  if (orientation === 'vertical') {
    return (
      <div className='relative pl-8 flex flex-col gap-8'>
        {/* Continuous vertical line linking steps */}
        <div className='absolute left-3 top-2 bottom-2 w-[2px] bg-muted' />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeStep
          const isActive = idx === activeStep

          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stepper steps are static
              key={idx}
              className='relative flex flex-col gap-1'
            >
              {/* Timeline circle dot */}
              <div
                className={`absolute -left-[31px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-highlight border-brand-highlight text-brand-highlight-foreground'
                    : isActive
                      ? 'bg-card border-brand-highlight text-brand-highlight ring-4 ring-brand-highlight/10'
                      : 'bg-card border-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Icon name='check' className='size-3.5' />
                ) : (
                  <div
                    className={`size-2 rounded-full ${isActive ? 'bg-brand-highlight' : 'bg-transparent'}`}
                  />
                )}
              </div>

              {/* Step info */}
              <div className='flex flex-col gap-0.5'>
                {(step.date || step.time) && (
                  <span className='text-xs text-muted-foreground font-mono'>
                    {step.date} {step.time ? `às ${step.time}` : ''}
                  </span>
                )}
                <h4
                  className={`text-sm font-semibold ${isActive ? 'text-brand-highlight' : 'text-foreground'}`}
                >
                  {step.label}
                </h4>
                {step.description && (
                  <p className='text-xs text-muted-foreground'>{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal orientation (more robust)
  return (
    <div className='relative flex justify-between items-center w-full my-4'>
      {/* Background track line */}
      <div className='absolute top-5 left-0 w-full h-[3px] bg-muted z-0' />

      {/* Active progress line fill */}
      <div
        className='absolute top-5 left-0 h-[3px] bg-brand-highlight transition-all duration-500 z-0'
        style={{ width: `${(activeStep / steps.length) * 100}%` }}
      />

      {steps.map((step, idx) => {
        const isCompleted = idx < activeStep
        const isActive = idx === activeStep

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: stepper steps are static
            key={idx}
            className='flex flex-col items-center text-center relative z-10 flex-1'
          >
            {/* Step marker circle */}
            <div
              className={`size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-brand-highlight border-brand-highlight text-brand-highlight-foreground'
                  : isActive
                    ? 'bg-card border-brand-highlight text-brand-highlight ring-4 ring-brand-highlight/10'
                    : 'bg-card border-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <Icon name='check' className='size-5' />
              ) : (
                <span className='text-sm font-semibold'>{idx + 1}</span>
              )}
            </div>

            {/* Step labels */}
            <div className='mt-3 px-2'>
              <span
                className={`text-xs md:text-sm font-medium block ${isActive ? 'text-brand-highlight' : 'text-foreground'}`}
              >
                {step.label}
              </span>
              {step.description && (
                <span className='text-[10px] md:text-xs text-muted-foreground block mt-0.5 max-w-[120px] mx-auto'>
                  {step.description}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
